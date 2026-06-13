"""
翻译模型运行时参数：页面可配，持久化到 workspace/.subtitle_player/translate_config.json。

覆盖 .env 中的模型名及 temperature / max_tokens / batch_size；
API Key 与 Base URL 仍只读 .env，不在页面修改。
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import Any
from urllib.parse import urlparse

from .paths import user_data_dir

_CONFIG_DIR = user_data_dir()
_CONFIG_FILE = _CONFIG_DIR / "translate_config.json"

TEMP_MIN, TEMP_MAX = 0.0, 2.0
MAX_TOKENS_MIN, MAX_TOKENS_MAX = 256, 16384
BATCH_MIN, BATCH_MAX = 1, 32

DEFAULT_TRANSLATE_MODEL = "qwen3.6-flash"


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

_CONFIG_KEYS = ("model", "temperature", "max_tokens", "batch_size")


def _load_file() -> dict[str, Any]:
    if not _CONFIG_FILE.exists():
        return {}
    try:
        data = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _env_model() -> str:
    from .translator import DEFAULT_TRANSLATE_MODEL, _get_translate_config

    cfg = _get_translate_config()
    if cfg:
        return cfg[0]
    import os

    from .paths import load_env
    load_env()
    return os.getenv("TRANSLATE_MODEL", "").strip() or DEFAULT_TRANSLATE_MODEL


def validate_config(data: dict[str, Any]) -> dict[str, Any]:
    """校验并规范化配置字段，非法则抛 ValueError。"""
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

    return {
        "model": model,
        "temperature": round(temperature, 2),
        "max_tokens": max_tokens,
        "batch_size": batch_size,
    }


def get_effective_params() -> TranslateParams:
    """合并 .env 默认模型与用户覆盖项，得到实际翻译参数。"""
    user = _load_file()
    base = {
        "model": _env_model(),
        "temperature": DEFAULT_PARAMS.temperature,
        "max_tokens": DEFAULT_PARAMS.max_tokens,
        "batch_size": DEFAULT_PARAMS.batch_size,
    }
    for k in _CONFIG_KEYS:
        if k in user and user[k] is not None and user[k] != "":
            base[k] = user[k]
    validated = validate_config(base)
    return TranslateParams(**validated)


def save_user_config(data: dict[str, Any]) -> TranslateParams:
    validated = validate_config(data)
    _CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    _CONFIG_FILE.write_text(
        json.dumps(validated, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return TranslateParams(**validated)


def reset_user_config() -> None:
    if _CONFIG_FILE.exists():
        _CONFIG_FILE.unlink()


def get_config_public() -> dict[str, Any]:
    from .translator import DEFAULT_DASHSCOPE_BASE_URL, _get_translate_config, llm_available

    eff = get_effective_params()
    cfg = _get_translate_config()
    user = _load_file()
    base_url = cfg[1] if cfg else DEFAULT_DASHSCOPE_BASE_URL
    parsed = urlparse(base_url)

    return {
        "model": eff.model,
        "temperature": eff.temperature,
        "max_tokens": eff.max_tokens,
        "batch_size": eff.batch_size,
        "env_model": _env_model(),
        "has_user_config": bool(user),
        "user_overrides": {k: user[k] for k in _CONFIG_KEYS if k in user},
        "defaults": asdict(DEFAULT_PARAMS),
        "limits": {
            "temperature": [TEMP_MIN, TEMP_MAX],
            "max_tokens": [MAX_TOKENS_MIN, MAX_TOKENS_MAX],
            "batch_size": [BATCH_MIN, BATCH_MAX],
        },
        "base_url": base_url,
        "base_url_host": parsed.netloc or base_url,
        "api_key_configured": bool(cfg and cfg[2]),
        "llm_available": llm_available(),
    }
