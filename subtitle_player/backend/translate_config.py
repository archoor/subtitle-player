"""
翻译模型运行时参数：面板优先，.env 可选兜底。

持久化到用户数据目录 translate_config.json，可配置：
  model / temperature / max_tokens / batch_size / base_url / api_key

优先级（每项独立）：
  面板 translate_config.json > 环境变量 .env > 内置默认值 / 通用兜底
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import asdict, dataclass
from typing import Any
from urllib.parse import urlparse

from .paths import load_env, user_data_dir

_CONFIG_DIR = user_data_dir()
_CONFIG_FILE = _CONFIG_DIR / "translate_config.json"

TEMP_MIN, TEMP_MAX = 0.0, 2.0
MAX_TOKENS_MIN, MAX_TOKENS_MAX = 256, 16384
BATCH_MIN, BATCH_MAX = 1, 32

DEFAULT_TRANSLATE_MODEL = "qwen3.6-flash"
DEFAULT_DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

_PARAM_KEYS = ("model", "temperature", "max_tokens", "batch_size")
_CREDENTIAL_KEYS = ("base_url", "api_key")
_ALL_KEYS = _PARAM_KEYS + _CREDENTIAL_KEYS

_URL_RE = re.compile(r"^https?://", re.I)


@dataclass
class TranslateParams:
    model: str
    temperature: float
    max_tokens: int
    batch_size: int


DEFAULT_PARAMS = TranslateParams(
    model=DEFAULT_TRANSLATE_MODEL,
    temperature=0.3,
    max_tokens=4096,
    batch_size=16,
)


def _load_user_file() -> dict[str, Any]:
    if not _CONFIG_FILE.exists():
        return {}
    try:
        data = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _generic_env_fallback() -> tuple[str, str, str] | None:
    """通用 OpenAI 兼容兜底：SUMMARY_* / BASE_URL / API_KEY。"""
    load_env()
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


def _env_credentials() -> dict[str, str]:
    """从 .env 读取翻译专用凭据（不含面板配置）。"""
    load_env()
    base_url = (
        os.getenv("TRANSLATE_BASE_URL", "").strip()
        or os.getenv("DASHSCOPE_OPENAI_BASE_URL", "").strip()
    )
    api_key = (
        os.getenv("TRANSLATE_API_KEY", "").strip()
        or os.getenv("DASHSCOPE_API_KEY", "").strip()
    )
    model = os.getenv("TRANSLATE_MODEL", "").strip()
    out: dict[str, str] = {}
    if base_url:
        out["base_url"] = base_url
    if api_key:
        out["api_key"] = api_key
    if model:
        out["model"] = model
    return out


def _normalize_base_url(url: str) -> str:
    return url.strip().rstrip("/")


def _env_default_model() -> str:
    return _env_credentials().get("model") or DEFAULT_TRANSLATE_MODEL


def validate_config(data: dict[str, Any], *, existing: dict[str, Any] | None = None) -> dict[str, Any]:
    """校验并规范化配置字段，非法则抛 ValueError。"""
    existing = existing or {}

    if "model" not in data:
        raise ValueError("缺少 model")
    model = str(data["model"]).strip()
    if not model:
        raise ValueError("model 不能为空")

    try:
        temperature = float(data.get("temperature", DEFAULT_PARAMS.temperature))
    except (TypeError, ValueError) as e:
        raise ValueError("temperature 必须是数字") from e
    if not (TEMP_MIN <= temperature <= TEMP_MAX):
        raise ValueError(f"temperature 须在 {TEMP_MIN} ~ {TEMP_MAX} 之间")

    try:
        max_tokens = int(data.get("max_tokens", DEFAULT_PARAMS.max_tokens))
    except (TypeError, ValueError) as e:
        raise ValueError("max_tokens 必须是整数") from e
    if not (MAX_TOKENS_MIN <= max_tokens <= MAX_TOKENS_MAX):
        raise ValueError(f"max_tokens 须在 {MAX_TOKENS_MIN} ~ {MAX_TOKENS_MAX} 之间")

    try:
        batch_size = int(data.get("batch_size", DEFAULT_PARAMS.batch_size))
    except (TypeError, ValueError) as e:
        raise ValueError("batch_size 必须是整数") from e
    if not (BATCH_MIN <= batch_size <= BATCH_MAX):
        raise ValueError(f"batch_size 须在 {BATCH_MIN} ~ {BATCH_MAX} 之间")

    out: dict[str, Any] = {
        "model": model,
        "temperature": round(temperature, 2),
        "max_tokens": max_tokens,
        "batch_size": batch_size,
    }

    if "base_url" in data:
        base_url = _normalize_base_url(str(data.get("base_url") or ""))
        if base_url:
            if not _URL_RE.match(base_url):
                raise ValueError("base_url 须以 http:// 或 https:// 开头")
            out["base_url"] = base_url
        elif existing.get("base_url"):
            out["base_url"] = existing["base_url"]

    if "api_key" in data:
        api_key = str(data.get("api_key") or "").strip()
        if api_key:
            out["api_key"] = api_key
        elif existing.get("api_key"):
            out["api_key"] = existing["api_key"]

    return out


def get_effective_params() -> TranslateParams:
    """合并 .env 默认模型与用户覆盖项，得到实际生成参数。"""
    user = _load_user_file()
    base = {
        "model": _env_default_model(),
        "temperature": DEFAULT_PARAMS.temperature,
        "max_tokens": DEFAULT_PARAMS.max_tokens,
        "batch_size": DEFAULT_PARAMS.batch_size,
    }
    for k in _PARAM_KEYS:
        if k in user and user[k] is not None and user[k] != "":
            base[k] = user[k]
    validated = validate_config(base, existing=user)
    return TranslateParams(
        model=validated["model"],
        temperature=validated["temperature"],
        max_tokens=validated["max_tokens"],
        batch_size=validated["batch_size"],
    )


def _resolve_base_url(user: dict[str, Any], env: dict[str, str]) -> tuple[str, str]:
    if user.get("base_url"):
        return str(user["base_url"]), "user"
    if env.get("base_url"):
        return env["base_url"], "env"
    return DEFAULT_DASHSCOPE_BASE_URL, "default"


def _resolve_api_key(user: dict[str, Any], env: dict[str, str]) -> tuple[str, str]:
    if user.get("api_key"):
        return str(user["api_key"]), "user"
    if env.get("api_key"):
        return env["api_key"], "env"
    return "", "none"


def get_effective_credentials() -> tuple[str, str, str] | None:
    """
    面板优先的有效 LLM 凭据：(model, base_url, api_key)。
    百炼专用凭据不足时回退通用 .env 兜底。
    """
    user = _load_user_file()
    env = _env_credentials()
    params = get_effective_params()

    base_url, _ = _resolve_base_url(user, env)
    api_key, _ = _resolve_api_key(user, env)
    model = params.model

    if base_url and api_key:
        return model, base_url, api_key
    return _generic_env_fallback()


def llm_available() -> bool:
    return get_effective_credentials() is not None


def save_user_config(data: dict[str, Any]) -> TranslateParams:
    existing = _load_user_file()
    validated = validate_config(data, existing=existing)
    _CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    merged = {**existing, **validated}
    # 仅持久化已知字段
    to_save = {k: merged[k] for k in _ALL_KEYS if k in merged and merged[k] not in (None, "")}
    _CONFIG_FILE.write_text(
        json.dumps(to_save, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return get_effective_params()


def reset_user_config() -> None:
    if _CONFIG_FILE.exists():
        _CONFIG_FILE.unlink()


def _api_key_hint(key: str) -> str:
    if len(key) <= 4:
        return "****"
    return f"···{key[-4:]}"


def get_config_public() -> dict[str, Any]:
    user = _load_user_file()
    env = _env_credentials()
    eff = get_effective_params()
    creds = get_effective_credentials()

    base_url, base_source = _resolve_base_url(user, env)
    api_key, key_source = _resolve_api_key(user, env)
    parsed = urlparse(base_url)

    effective_key = api_key
    if not effective_key and creds:
        effective_key = creds[2]

    return {
        "model": eff.model,
        "temperature": eff.temperature,
        "max_tokens": eff.max_tokens,
        "batch_size": eff.batch_size,
        "base_url": base_url,
        "env_model": _env_default_model(),
        "has_user_config": bool(user),
        "user_overrides": {k: user[k] for k in _ALL_KEYS if k in user and k != "api_key"},
        "defaults": {
            **asdict(DEFAULT_PARAMS),
            "base_url": DEFAULT_DASHSCOPE_BASE_URL,
        },
        "limits": {
            "temperature": [TEMP_MIN, TEMP_MAX],
            "max_tokens": [MAX_TOKENS_MIN, MAX_TOKENS_MAX],
            "batch_size": [BATCH_MIN, BATCH_MAX],
        },
        "base_url_host": parsed.netloc or base_url,
        "base_url_source": base_source,
        "api_key_configured": bool(effective_key),
        "api_key_hint": _api_key_hint(effective_key) if effective_key else "",
        "api_key_source": key_source if effective_key else "none",
        "llm_available": llm_available(),
        "env_configured": bool(env.get("api_key")),
    }
