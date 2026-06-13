"""
FastAPI 应用：托管前端 + 提供字幕解析 / 翻译接口。

路由：
  GET  /                      前端页面
  GET  /api/subtitle?path=    解析服务器路径字幕（命中缓存则带译文）
  POST /api/subtitle/upload   上传本地字幕文件并解析
  GET  /api/translate?path=   SSE 流式翻译并写缓存
  GET  /api/health            探活 + LLM 是否可用
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from fastapi import FastAPI, File, Query, UploadFile
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from . import translator
from .parser import parse_subtitle
from .paths import frontend_dir, load_env, project_root, user_data_dir
from .translate_config import get_config_public, reset_user_config, save_user_config

# 启动即按优先级加载 .env（exe 同目录 → 用户数据目录 → 项目根）
load_env()

_ROOT = project_root()
_FRONTEND = frontend_dir()
_UPLOAD_DIR = user_data_dir() / "uploads"
_SUBTITLE_EXTS = {".txt", ".srt", ".vtt"}

app = FastAPI(title="字幕播放工具")


class TranslateConfigBody(BaseModel):
    model: str = Field(..., min_length=1, description="翻译模型名")
    base_url: str = Field("", description="OpenAI 兼容 API Base URL")
    api_key: str = Field("", description="API Key；留空表示保留已保存的 Key")
    temperature: float = Field(0.3, ge=0.0, le=2.0)
    max_tokens: int = Field(4096, ge=256, le=16384)
    batch_size: int = Field(16, ge=1, le=32)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "llm": translator.llm_available()}


@app.get("/api/translate-config")
def get_translate_config() -> dict:
    """读取当前翻译参数（含 .env 与用户覆盖）。"""
    return get_config_public()


@app.put("/api/translate-config")
def put_translate_config(body: TranslateConfigBody) -> dict:
    """保存翻译参数（立即生效，无需重启）。"""
    try:
        save_user_config(body.model_dump())
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=422)
    return get_config_public()


@app.post("/api/translate-config/reset")
def post_translate_config_reset() -> dict:
    """删除面板覆盖项，回退到 .env / 默认值。"""
    reset_user_config()
    return get_config_public()


def _subtitle_response(sub, *, display_name: str | None = None) -> JSONResponse:
    translator.load_cache(sub)
    data = sub.to_dict()
    data["llm"] = translator.llm_available()
    if display_name:
        data["display_name"] = display_name
    return JSONResponse(data)


@app.get("/api/subtitle")
def get_subtitle(path: str = Query(..., description="字幕文件绝对/相对路径")) -> JSONResponse:
    """解析服务器上的字幕文件；若有缓存译文则一并返回。"""
    src = Path(path)
    if not src.is_absolute():
        src = (_ROOT / path).resolve()
    try:
        sub = parse_subtitle(src)
    except FileNotFoundError as e:
        return JSONResponse({"error": str(e)}, status_code=404)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=422)
    return _subtitle_response(sub)


@app.post("/api/subtitle/upload")
async def upload_subtitle(file: UploadFile = File(...)) -> JSONResponse:
    """上传本地字幕文件（浏览器原生选择框），解析后返回字幕数据。"""
    orig_name = Path(file.filename or "upload.txt").name
    suffix = Path(orig_name).suffix.lower()
    if suffix not in _SUBTITLE_EXTS:
        return JSONResponse(
            {"error": f"不支持的格式「{suffix}」，请选 .txt / .srt / .vtt"},
            status_code=422,
        )

    content = await file.read()
    if not content:
        return JSONResponse({"error": "文件为空"}, status_code=422)

    _UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(content).hexdigest()[:16]
    dest = _UPLOAD_DIR / f"{digest}_{orig_name}"
    if not dest.exists():
        dest.write_bytes(content)

    try:
        sub = parse_subtitle(dest)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=422)

    return _subtitle_response(sub, display_name=orig_name)


@app.get("/api/translate")
def translate(path: str = Query(...)) -> StreamingResponse:
    """SSE 流式翻译。事件 data 为 JSON：progress / error / done / result。"""
    src = Path(path)
    if not src.is_absolute():
        src = (_ROOT / path).resolve()

    def event_stream():
        try:
            sub = parse_subtitle(src)
        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})
            return

        translator.load_cache(sub)
        for ev in translator.translate_stream(sub):
            yield _sse(ev)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


# 前端静态资源：逐条注册，避免 mount("/") 吞掉未匹配的 POST /api/*
@app.get("/")
def index() -> FileResponse:
    return FileResponse(_FRONTEND / "index.html")


@app.get("/style.css")
def style_css() -> FileResponse:
    return FileResponse(_FRONTEND / "style.css", media_type="text/css")


@app.get("/app.js")
def app_js() -> FileResponse:
    return FileResponse(_FRONTEND / "app.js", media_type="application/javascript")


@app.get("/i18n.js")
def i18n_js() -> FileResponse:
    return FileResponse(_FRONTEND / "i18n.js", media_type="application/javascript")
