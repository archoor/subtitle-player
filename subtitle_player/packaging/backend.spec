# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller 配置：把字幕播放工具后端（FastAPI + uvicorn）打成独立可执行目录。

产物（onedir）：dist/SubtitlePlayer-backend/SubtitlePlayer-backend(.exe)
  - 入口 subtitle_player/run.py，接受 --no-open --port <p>
  - frontend/ 作为数据打入，运行时由 backend/paths.py 经 _MEIPASS 定位
  - 不依赖 scripts.lib（翻译配置已内联）

构建（项目根目录执行）：
  uv run pyinstaller --noconfirm subtitle_player/packaging/backend.spec

随后 electron-builder 会把 dist/SubtitlePlayer-backend 作为 extraResources 封进单 exe。
"""

import os

# spec 同级为 packaging/，其上两级为项目根
PROJECT_ROOT = os.path.abspath(os.path.join(SPECPATH, "..", ".."))

datas = [
    (os.path.join(PROJECT_ROOT, "subtitle_player", "frontend"), "frontend"),
]

hiddenimports = [
    # 后端包（静态相对导入一般可被探测，这里冗余声明确保万无一失）
    "subtitle_player",
    "subtitle_player.backend.app",
    "subtitle_player.backend.parser",
    "subtitle_player.backend.translator",
    "subtitle_player.backend.translate_config",
    "subtitle_player.backend.models",
    "subtitle_player.backend.paths",
    # 函数内动态导入的第三方库
    "dotenv",
    "openai",
    "httpx",
    # uvicorn 运行时动态加载的子模块
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "uvicorn.lifespan.off",
]

a = Analysis(
    [os.path.join(PROJECT_ROOT, "subtitle_player", "run.py")],
    pathex=[PROJECT_ROOT],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="SubtitlePlayer-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # 后端控制台窗口由 Electron 以 windowsHide 隐藏
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="SubtitlePlayer-backend",
)
