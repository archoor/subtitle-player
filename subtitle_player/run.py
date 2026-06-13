"""
字幕播放工具启动入口。

用法：
  uv run python subtitle_player/run.py            # 默认 127.0.0.1:8800，自动打开浏览器
  uv run python subtitle_player/run.py --port 9000
  uv run python subtitle_player/run.py --no-open  # 不自动打开浏览器

启动后浏览器访问 http://127.0.0.1:8800 即可使用。
"""

from __future__ import annotations

import argparse
import sys
import threading
import time
import webbrowser
from pathlib import Path

# 注入项目根，使后端可 import scripts.lib（复用 LLM 配置）
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


def _open_browser_later(url: str, delay: float = 1.2) -> None:
    def _open():
        time.sleep(delay)
        try:
            webbrowser.open(url)
        except Exception:
            pass
    threading.Thread(target=_open, daemon=True).start()


def main() -> int:
    ap = argparse.ArgumentParser(description="字幕播放工具")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8800)
    ap.add_argument("--no-open", action="store_true", help="不自动打开浏览器")
    args = ap.parse_args()

    import uvicorn

    # 直接导入 app 对象（而非 "module:app" 字符串）：
    # 既适配开发态，也让 PyInstaller 能静态分析并打包后端依赖。
    from subtitle_player.backend.app import app

    url = f"http://{args.host}:{args.port}"
    print(f"字幕播放工具启动中 … 打开 {url}")
    if not args.no_open:
        _open_browser_later(url)

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
