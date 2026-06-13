"""
运行环境路径解析：统一处理「开发态 / PyInstaller 冻结态」的资源与可写目录。

为什么需要它：
- 打包成单 exe 后，源码目录结构（项目根、frontend/）不再存在；前端等只读资源
  被 PyInstaller 解压到临时目录 `sys._MEIPASS`，而缓存/配置/上传等可写文件
  绝不能写进该临时目录，必须落到稳定的用户数据目录。
- `.env` 在打包后也不在「项目根」，需要按「exe 同目录 → 用户数据目录 → 项目根(开发)」
  的优先级查找加载。

对外函数：
- is_frozen()        是否处于 PyInstaller 冻结环境
- resource_dir()     只读资源根（开发=subtitle_player/，冻结=_MEIPASS）
- frontend_dir()     前端静态资源目录
- project_root()     项目根（开发态用于扫描；冻结态回退到 exe 目录）
- user_data_dir()    可写用户数据目录（%APPDATA%/SubtitlePlayer 或 ~/.config/SubtitlePlayer）
- load_env()         按优先级加载 .env 到环境变量（仅加载一次）
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_APP_DIR_NAME = "SubtitlePlayer"
_env_loaded = False


def is_frozen() -> bool:
    """是否由 PyInstaller 打包运行。"""
    return bool(getattr(sys, "frozen", False))


def resource_dir() -> Path:
    """
    只读资源根目录。
    - 冻结态：PyInstaller 解压目录 `sys._MEIPASS`（其下含 frontend/）。
    - 开发态：`subtitle_player/` 目录（backend 的上一级）。
    """
    if is_frozen():
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
    return Path(__file__).resolve().parents[1]


def frontend_dir() -> Path:
    """前端静态资源目录。"""
    return resource_dir() / "frontend"


def exe_dir() -> Path:
    """可执行文件所在目录（冻结态=exe 目录；开发态=项目根）。"""
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return project_root()


def project_root() -> Path:
    """
    项目根目录。
    - 开发态：`subtitle_player/` 的上一级（即仓库根）。
    - 冻结态：无源码结构，回退到 exe 所在目录。
    """
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[2]


def user_data_dir() -> Path:
    """
    可写的用户数据目录，存放上传文件、翻译配置等。
    Windows: %APPDATA%/SubtitlePlayer；其他: ~/.config/SubtitlePlayer。
    目录不存在时自动创建。
    """
    if os.name == "nt":
        base = Path(os.getenv("APPDATA") or Path.home())
    else:
        base = Path(os.getenv("XDG_CONFIG_HOME") or (Path.home() / ".config"))
    d = base / _APP_DIR_NAME
    d.mkdir(parents=True, exist_ok=True)
    return d


def _env_candidates() -> list[Path]:
    """.env 查找顺序：exe 同目录 → 用户数据目录 → 项目根（开发态）。"""
    seen: set[str] = set()
    out: list[Path] = []
    for p in (exe_dir() / ".env", user_data_dir() / ".env", project_root() / ".env"):
        key = str(p)
        if key not in seen:
            seen.add(key)
            out.append(p)
    return out


def load_env() -> None:
    """
    按优先级把首个存在的 .env 加载进环境变量（override=False，不覆盖既有）。
    多次调用只生效一次。无 python-dotenv 或无 .env 时静默跳过。
    """
    global _env_loaded
    if _env_loaded:
        return
    _env_loaded = True
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    for cand in _env_candidates():
        if cand.exists():
            load_dotenv(cand, override=False)
            break
