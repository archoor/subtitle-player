"""
译文翻译 + 缓存。

策略：
- 源英文 → 译中文；源中文 → 译英文。译文写入 Segment 的另一字段。
- 翻译模型：阿里云百炼 DashScope（OpenAI 兼容），默认 qwen3.7-flash。
  配置读 .env：DASHSCOPE_OPENAI_BASE_URL + DASHSCOPE_API_KEY + 可选 TRANSLATE_MODEL；
  缺失时回退 scripts.lib.transcript_common.get_llm_config()。
  百炼为国内直连，调用时忽略系统代理（trust_env=False）。
- 分批翻译（默认每批 16 段），每批完成即 SSE 推送 segment 事件，支持边译边播。
- 每批完成后增量写缓存，中断后可续翻。

对外主要函数：
- cache_path_for(src)         缓存文件路径
- load_cache(subtitle)        若有匹配缓存则把译文合并进 subtitle，返回是否命中
- save_cache(subtitle)        写缓存
- translate_stream(subtitle)  生成器：逐批翻译并 yield 进度，最终 subtitle 就地填充译文
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterator

from .models import Subtitle

# 延迟导入 scripts.lib：依赖 run.py 已把项目根注入 sys.path
BATCH_SIZE = 16
_NUM_LINE = re.compile(r"^\s*(\d+)[.、:：)]\s*(.*)$")

# 默认翻译模型（阿里云百炼 DashScope，OpenAI 兼容）
DEFAULT_TRANSLATE_MODEL = "qwen3.6-flash"
DEFAULT_DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"


def _generic_fallback_config() -> tuple[str, str, str] | None:
    """
    通用兜底 LLM 配置（已内联，不再依赖 scripts.lib）：读 .env 的
      base_url：SUMMARY_BASE_URL → BASE_URL
      api_key ：SUMMARY_API_KEY  → API_KEY
      model   ：SUMMARY_MODEL → FAST_MODEL → MAIN_MODEL
    返回 None 表示配置不足。
    """
    import os

    base_url = (
        os.getenv("SUMMARY_BASE_URL", "").strip()
        or os.getenv("BASE_URL", "").strip()
    )
    api_key = (
        os.getenv("SUMMARY_API_KEY", "").strip()
        or os.getenv("API_KEY", "").strip()
    )
    if not base_url or not api_key:
        return None
    for env_key in ("SUMMARY_MODEL", "FAST_MODEL", "MAIN_MODEL"):
        model = os.getenv(env_key, "").strip()
        if model:
            return model, base_url, api_key
    return None


def _get_translate_config() -> tuple[str, str, str] | None:
    """
    获取翻译用 LLM 配置：(model, base_url, api_key)。

    优先级（专用 → 百炼 → 通用兜底）：
      base_url：TRANSLATE_BASE_URL → DASHSCOPE_OPENAI_BASE_URL（默认百炼兼容地址）
      api_key ：TRANSLATE_API_KEY  → DASHSCOPE_API_KEY
      model   ：TRANSLATE_MODEL    → 默认 qwen3.6-flash

    若百炼 api_key 缺失，则回退到内联的通用兜底配置（SUMMARY_*/BASE_URL 等）。
    返回 None 表示配置不足。
    """
    import os

    from .paths import load_env
    load_env()

    base_url = (
        os.getenv("TRANSLATE_BASE_URL", "").strip()
        or os.getenv("DASHSCOPE_OPENAI_BASE_URL", "").strip()
        or DEFAULT_DASHSCOPE_BASE_URL
    )
    api_key = (
        os.getenv("TRANSLATE_API_KEY", "").strip()
        or os.getenv("DASHSCOPE_API_KEY", "").strip()
    )
    model = os.getenv("TRANSLATE_MODEL", "").strip() or DEFAULT_TRANSLATE_MODEL

    if base_url and api_key:
        return model, base_url, api_key

    # 回退：内联的通用 LLM 配置（不依赖 scripts.lib，便于打包）
    return _generic_fallback_config()


# 别名，保持对外语义
_get_llm_config = _get_translate_config


def llm_available() -> bool:
    return _get_translate_config() is not None


def cache_path_for(src: str | Path) -> Path:
    p = Path(src)
    return p.with_suffix(".bilingual.json")


def load_cache(subtitle: Subtitle) -> bool:
    """
    若缓存存在且段数一致，则把译文合并进 subtitle，并标记 translated=True。
    返回是否命中缓存。
    """
    cp = cache_path_for(subtitle.source_file)
    if not cp.exists():
        return False
    try:
        data = json.loads(cp.read_text(encoding="utf-8"))
    except Exception:
        return False

    cached = data.get("segments") or []
    if len(cached) != len(subtitle.segments):
        return False

    for seg, c in zip(subtitle.segments, cached):
        if not seg.en and c.get("en"):
            seg.en = c["en"]
        if not seg.zh and c.get("zh"):
            seg.zh = c["zh"]

    subtitle.translated = all(s.en and s.zh for s in subtitle.segments)
    return True


def save_cache(subtitle: Subtitle) -> Path:
    cp = cache_path_for(subtitle.source_file)
    cp.write_text(
        json.dumps(subtitle.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return cp


def _build_prompt(lines: list[str], target_lang: str) -> str:
    target_name = "中文" if target_lang == "zh" else "英文"
    numbered = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(lines))
    return (
        f"你是专业字幕译者。请把下面带编号的字幕逐条翻译成{target_name}。\n"
        f"要求：\n"
        f"1. 严格保持编号与条数一一对应，共 {len(lines)} 条。\n"
        f"2. 每条输出格式为「编号. 译文」，不要合并、不要拆分、不要加解释。\n"
        f"3. 口语自然、简洁，符合字幕风格。\n\n"
        f"{numbered}"
    )


def _parse_response(text: str, n: int) -> list[str]:
    """从 LLM 回复解析出 n 条译文，按编号对齐；失败时按行兜底。"""
    result: dict[int, str] = {}
    for line in text.splitlines():
        m = _NUM_LINE.match(line)
        if m:
            idx = int(m.group(1))
            if 1 <= idx <= n:
                result[idx] = m.group(2).strip()

    if len(result) >= n:
        return [result.get(i + 1, "") for i in range(n)]

    # 兜底：去掉空行后按顺序对齐
    plain = [l.strip() for l in text.splitlines() if l.strip()]
    if len(plain) == n:
        return [_NUM_LINE.sub(r"\2", l) if _NUM_LINE.match(l) else l for l in plain]

    # 仍不齐：用已解析到的，缺的留空
    return [result.get(i + 1, "") for i in range(n)]


def _translate_batch(
    lines: list[str],
    target_lang: str,
    model: str,
    base_url: str,
    api_key: str,
    *,
    temperature: float,
    max_tokens: int,
) -> list[str]:
    from openai import OpenAI
    # 百炼为国内直连：trust_env=False 忽略系统 HTTP(S)_PROXY/ALL_PROXY（避免走 Google 代理失败）
    http_client = None
    try:
        import httpx
        http_client = httpx.Client(trust_env=False, timeout=60.0)
    except Exception:
        http_client = None

    client = OpenAI(base_url=base_url, api_key=api_key, http_client=http_client)
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": _build_prompt(lines, target_lang)}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = (resp.choices[0].message.content or "").strip()
    return _parse_response(content, len(lines))


def translate_stream(subtitle: Subtitle) -> Iterator[dict]:
    """
    逐批翻译，每完成一段即推送 segment 事件；subtitle 就地填充译文。

    yield 事件：
      {"type": "progress", "done": int, "total": int}
      {"type": "segment", "index": int, "zh"|"en": str, "done": int, "total": int}
      {"type": "error", "message": str}
      {"type": "done", "translated": bool}
    """
    from .translate_config import get_effective_params

    cfg = _get_llm_config()
    if cfg is None:
        yield {
            "type": "error",
            "message": "未检测到百炼配置，无法翻译。请在 .env 配置 DASHSCOPE_API_KEY。",
        }
        return

    _model, base_url, api_key = cfg
    params = get_effective_params()
    model = params.model
    batch_size = params.batch_size
    target_lang = "zh" if subtitle.src_lang == "en" else "en"

    pending = [
        i for i, s in enumerate(subtitle.segments)
        if not (s.zh if target_lang == "zh" else s.en)
    ]
    total = len(pending)
    if total == 0:
        subtitle.translated = True
        yield {"type": "done", "translated": True}
        return

    done = 0
    yield {"type": "progress", "done": 0, "total": total}

    for b in range(0, total, batch_size):
        batch_idx = pending[b: b + batch_size]
        src_field = "en" if subtitle.src_lang == "en" else "zh"
        lines = [getattr(subtitle.segments[i], src_field) for i in batch_idx]

        try:
            translated = _translate_batch(
                lines,
                target_lang,
                model,
                base_url,
                api_key,
                temperature=params.temperature,
                max_tokens=params.max_tokens,
            )
        except Exception as e:
            yield {"type": "error", "message": f"批次翻译失败：{type(e).__name__}: {e}"}
            translated = ["" for _ in lines]

        for i, tr in zip(batch_idx, translated):
            if tr:
                setattr(subtitle.segments[i], target_lang, tr)
                done += 1
                yield {
                    "type": "segment",
                    "index": i,
                    target_lang: tr,
                    "done": done,
                    "total": total,
                }

        yield {"type": "progress", "done": done, "total": total}
        save_cache(subtitle)  # 增量缓存，中断可续

    subtitle.translated = all(s.en and s.zh for s in subtitle.segments)
    save_cache(subtitle)
    yield {"type": "done", "translated": subtitle.translated}
