# 参与贡献 Subtitle Player

[English](CONTRIBUTING.md) | **简体中文**

感谢你愿意参与贡献。本项目位于 `xk-knowledge-base` 仓库的 `subtitle_player/` 目录。

## 开发环境

### 前置条件

- [uv](https://docs.astral.sh/uv/) 与 Python ≥ 3.13（见根目录 `pyproject.toml`）
- 桌面端打包：Node.js 18+ 与 npm

### 运行 Web 版

```powershell
# 在仓库根目录
uv sync
uv run python subtitle_player/run.py
```

浏览器访问 `http://127.0.0.1:8800`。加 `--no-open` 可不自动打开浏览器。

### 运行 Electron 外壳（开发态）

```powershell
cd subtitle_player/desktop
npm install
npm start
```

需要本机已安装 `uv`；Electron 会启动 `uv run python subtitle_player/run.py`。

### 开发时启用翻译

将 `subtitle_player/.env.example` 复制到仓库根 `.env` 并填写 `DASHSCOPE_API_KEY`，或按 `.env.example` 配置通用 OpenAI 兼容接口。

## 目录说明

| 路径 | 职责 |
|------|------|
| `backend/` | FastAPI 路由、解析、翻译 |
| `frontend/` | 静态 UI（`index.html`、`app.js`、`i18n.js`） |
| `desktop/` | Electron 主进程与 preload |
| `packaging/` | PyInstaller 后端打包配置 |

## 代码规范

- 保持改动最小、避免过度抽象。
- Python：用 `uv` 管理依赖；新包加在**仓库根** `pyproject.toml`。
- 前端：原生 JS、无打包器；界面文案统一放在 `i18n.js` 的 `en` / `zh` 中。
- 注释：面向开源的公开说明优先英文；已有中文内部注释可保留。

## 文档

- 默认语言：**英文**（`README.md`、`docs/API.md`、`CONTRIBUTING.md`）。
- 中文版本：`*.zh-CN.md`，文首互相链接。
- 用户可见改动请更新 `CHANGELOG.md` 的 `[Unreleased]` 小节。

## 提交 Pull Request

1. 从父仓库主开发分支拉取并建功能分支。
2. 单次 PR 尽量只做一件事。
3. 手动验证：加载字幕、播放/暂停、拖动进度、翻译提示条、主题切换、界面语言切换。
4. 若改桌面端，打包前先 `npm start` 验证。

## 报告 Issue

请提供：

- 操作系统与版本
- Web 版还是 Electron
- 字幕格式（`.txt` / `.srt` / `.vtt`）
- 复现步骤与预期/实际结果
- 脱敏 API Key 与个人路径

## 许可证

贡献即表示你同意将代码以 [MIT 许可证](LICENSE) 发布。
