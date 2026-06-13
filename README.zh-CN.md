# 字幕播放工具 Subtitle Player

[English](README.md) | **简体中文**

[![Release](https://img.shields.io/github/v/release/archoor/subtitle-player)](https://github.com/archoor/subtitle-player/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **代码仓库：** https://github.com/archoor/subtitle-player

> **开源定时字幕阅读器**：支持 `.srt`、`.vtt`、FunASR `[hh:mm:ss]` `.txt` 转写稿 — **自动滚动**、**卡拉OK/MTV 逐字高亮**、**中英双语对照**、**LLM 字幕翻译**（百炼 DashScope / 通义千问）、**Windows 便携单文件 exe**。无需视频：仅凭字幕文件即可跟读练听力。

加载带时间戳的字幕文件，**模拟按时间播放**：自动下滚 + MTV 跑马灯逐字高亮，支持中英双语（英上中下窄屏堆叠）、护眼配色、速度与字号调节，中文译文按需用 LLM 生成并缓存。

两种使用形态（同一套前后端代码）：

- **Web 应用**：Python(FastAPI) 起本地服务，浏览器打开使用（开发/调试用）。
- **桌面客户端（Electron）**：打包成**单个 `SubtitlePlayer.exe`，双击即用**，内置 Python 后端，无需安装环境。见下方「桌面客户端与打包」。

---

## 项目简介

Subtitle Player 是一款**本地字幕阅读器 + 卡拉OK式歌词高亮工具**，适合已有转写稿（FunASR、Whisper、播客 STT、网课转录等）的用户，在**不打开视频播放器**的情况下按时间轴跟读。

**常见搜索词 / 同类需求：** 字幕播放器 · 双语字幕工具 · SRT/VTT 字幕查看 · 字幕自动滚动 · 跑马灯高亮 · 英文字幕翻译中文 · FunASR 转写播放 · 播客字幕阅读 · 护眼字幕 · 英语学习字幕 · 提词器字幕 · 开源字幕软件 · Electron 桌面版 · 便携 exe。

**技术栈：** Python · FastAPI · uvicorn · 原生 JavaScript · Electron · PyInstaller · SSE 流式 · 百炼 DashScope（OpenAI 兼容）· MIT 开源协议。

---

## 适用场景

| 场景 | 能做什么 |
|------|----------|
| **英语学习 / 听力跟读** | 英文字幕自动滚动居中；边播边生成中文对照，像歌词 App 一样跟读。 |
| **FunASR / 语音转写结果** | 直接打开 `[hh:mm:ss] 文本` 格式 `.txt`，不必先转成 SRT。 |
| **中英双语对照** | 切换双语 / 英文 / 中文视图；译文缓存为 `.bilingual.json` 可离线复用。 |
| **长时间阅读** | 米黄/暗色护眼主题、可调字号、当前行居中（类似提词器/歌词软件）。 |
| **只有字幕、没有视频** | 纯计时器驱动，没有原片也能按时间轴浏览字幕。 |
| **Windows 桌面使用** | 单个 `SubtitlePlayer.exe` 便携版，双击选文件，终端用户无需装 Python。 |
| **二次开发 / 自托管** | `uv run python subtitle_player/run.py` 本地启动；提供 REST + SSE API。 |

### 场景一：看 YouTube 等外文视频 — 下载字幕后中英混看

看 YouTube 或其他外文视频时，把字幕下载下来，在 Subtitle Player 里**中英对照跟读**，比单看一种语言学得更快。

1. 从视频下载字幕（浏览器扩展、`yt-dlp`、站点导出等），得到 `.srt` / `.vtt` 文件。
2. 在 Subtitle Player 中打开字幕，切换到**双语**视图（英文在上、中文在下）。
3. 若无中文，点「生成中文译文」或直接播放 — 翻译会边播边流入。
4. 另开窗口播放视频；对照本工具的自动滚动和跑马灯高亮，用眼睛跟住时间轴。
5. 点任意一行可跳转；调速度（0.5×–2×）匹配说话节奏。`.bilingual.json` 缓存下次打开无需重译。

> 提示：本工具不播放视频 — 视频留在浏览器里播，Subtitle Player 当作专用双语字幕窗。

### 场景二：播客 / 网课转写稿跟读（没有视频）

手里只有语音转写结果（FunASR、Whisper、`batch_transcribe` 等），**没有视频文件**也能跟读。

1. 直接打开 `[hh:mm:ss] 文本` 格式 `.txt` 或 `.srt`（FunASR 输出不必先转格式）。
2. 用**模拟播放**：当前行居中，逐字高亮像卡拉OK歌词。
3. 练听力切**英文**视图；需要对照再切**双语**并生成中文。
4. 语速快时降到 0.5×–0.75×；长时间阅读开护眼主题、调大字号。
5. 同一文件再次打开，译文缓存可续用，方便断点续学。

适合：播客笔记、网课回放、访谈转写等「只有稿、没有片」的场景。

### 场景三：会议演讲 / 技术分享 — 逐句精读

英文信息密度高（AI 演讲、产品发布会、学术报告），需要**停下来反复看、对照措辞**。

1. 加载官方或自动生成的 `.srt` / `.vtt` 字幕。
2. 先用**英文**视图通读；点任意一行即可跳转，比拖视频进度条更精准。
3. 切**双语**并生成中文，专攻术语和长句；未译完的行会显示占位提示。
4. 长时间精读时切换**暗色护眼**、放大字号（30–60 分钟也舒适）。
5. 双语结果缓存在 `*.bilingual.json`，可归档或与同事共享审阅。

适合：TED 类演讲、技术 Webinar、产品发布等「准确性比实时速度更重要」的内容。

---

## 常见问题 FAQ

**能播放视频或音频吗？**  
不能。这是**纯字幕模拟播放器**，按时间戳滚动和高亮，不与媒体文件同步。

**支持哪些字幕格式？**  
`.srt`、`.vtt`，以及 FunASR 风格 `.txt`（行首 `[hh:mm:ss]` 或 `[mm:ss]`）。

**能把英文字幕翻译成中文吗？**  
可以。打开 **⚙ 设置** 填写 Base URL 与 API Key 即可（无需 `.env`）；也可选用 `.env` 作为兜底。翻译通过 SSE 边播边推，结果缓存到字幕同目录。

**离线能用吗？**  
播放和已有 `.bilingual.json` 缓存可离线；**新翻译**需要网络和 API Key。

**FunASR 只有起始时间，高亮准吗？**  
结束时间由下一行起始推算；行内高亮按**字符数线性插值**——视觉效果像卡拉OK，但不是逐词强制对齐。

**Web 版和 Electron 桌面版区别？**  
界面相同。Web 版上传文件；桌面版用系统文件对话框。桌面版内置 Python 后端。

**免费开源吗？**  
是，[MIT 许可证](LICENSE)。位于 `xk-knowledge-base` 仓库的 `subtitle_player/` 目录。

---

## 功能

| 功能 | 说明 |
|------|------|
| 加载字幕 | 支持 funasr 的 `[hh:mm:ss] 文本` `.txt`，以及标准 `.srt` / `.vtt` |
| 视图切换 | 双语（英上中下，单列堆叠）、英文、中文；桌面端窗口固定单栏 450 宽；切到含中文的视图自动提示生成译文 |
| 模拟播放 | 纯计时器驱动（不放声音），当前行居中、平滑自动滚动 |
| 跑马灯高亮 | 当前行从左到右逐词点亮（类 MTV 歌词），多行换行不错位 |
| 速度调节 | 0.5x ~ 2x |
| 字号调节 | 16 ~ 40px 实时 |
| 护眼配色 | 默认「米黄护眼」，一键切「暗色护眼」，避开纯白纯黑、降蓝光 |
| 中文译文 | 流式翻译：逐段 SSE 推送，**边播放边翻译**；未译段落显示「还未翻译」；增量写缓存可续翻 |
| 界面语言 | 默认英文 UI，顶栏可切换 **EN / 中** |

> 时间戳说明：funasr 文本每行只有起始时间，本工具用「下一行起始」补齐结束时间，末行用统计行里的「音频时长」兜底。逐字高亮是在「本行→下一行」区间内按字符数线性插值估算，能做出跑马灯效果，但非逐词精确对齐。

---

## 快速开始

```powershell
# 在项目根目录执行（依赖已在根 pyproject.toml 中：fastapi / uvicorn）
uv run python subtitle_player/run.py
```

启动后自动打开浏览器 `http://127.0.0.1:8800`。

### 桌面快捷方式（Windows）

双击桌面 **「字幕播放工具」** 即可启动（会打开命令行窗口，关闭窗口即停止服务）。

若快捷方式不存在，可在项目根执行：

```powershell
powershell -ExecutionPolicy Bypass -File subtitle_player/create_desktop_shortcut.ps1
```

或直接双击 `subtitle_player/launch.bat`。

启动参数：

| 参数 | 默认 | 说明 |
|------|------|------|
| `--host` | `127.0.0.1` | 监听地址 |
| `--port` | `8800` | 端口 |
| `--no-open` | 否 | 不自动打开浏览器 |

```powershell
uv run python subtitle_player/run.py --port 9000 --no-open
```

---

## 使用方法

1. 点 **「选择文件…」** → 弹出浏览器原生文件选择框 → 选中 `.txt/.srt/.vtt` 后显示文件名 → 点 **「加载」**。
2. 点底部 ▶ 开始播放（或按 `空格` 播放/暂停）。
3. 点字幕任意一行可跳转到该处；拖动 / 点击进度条定位。
4. 顶栏右侧切换「双语 / 英文 / 中文」视图；**⚙** 打开翻译模型设置；**🌗** 切换护眼主题；**EN/中** 切换界面语言。
5. 若是纯英文字幕、想看中文：点「生成中文译文」，或**直接点播放**（会自动开始翻译）。翻译逐段流入，可边播边看；跳到未译段落会显示「还未翻译」。

### 快捷键

| 操作 | 键 |
|------|----|
| 播放 / 暂停 | `空格` |

---

## 中文译文（翻译）

**面板优先，`.env` 可选兜底。** 打开 **⚙ 设置** 配置 Base URL、API Key、模型 — 保存到用户数据目录，**立即生效**。面板未填写的项会回退读 `.env`（见 [`.env.example`](.env.example)）。

- 默认接口：阿里云**百炼 DashScope**（`https://dashscope.aliyuncs.com/compatible-mode/v1`），模型 `qwen3.6-flash`。
- 也支持任意 OpenAI 兼容接口。

| 面板 / `.env` 变量 | 说明 |
|-------------------|------|
| Base URL | OpenAI 兼容接口地址 |
| API Key | 服务密钥 |
| Model | 如 `qwen3.6-flash` — **`.env` 中可选**；可在 ⚙ 设置中配置或使用内置默认 |

面板还可调：`temperature`（0~2）、`max_tokens`（256~16384）、`batch_size`（1~32）。

**每项优先级：** 面板 `translate_config.json` → `.env`（`TRANSLATE_*` / `DASHSCOPE_*` / `BASE_URL`+`API_KEY`）→ 内置默认。

百炼为国内直连，调用时**自动忽略系统代理**。

未配置 API 时仍可正常播放字幕，只是无法自动翻译（提示条引导打开 ⚙ 设置）。

翻译结果缓存为字幕同目录的同名 `xxx.bilingual.json`；删除该文件即可强制重译。

---

## 桌面客户端与打包（Electron + PyInstaller → 单 exe）

桌面版本质是**给现有 Web 应用套一个 Electron 原生窗口外壳**：Electron 主进程选一个空闲端口启动内置的 Python 后端，等 `/api/health` 就绪后窗口加载本地地址；前端在检测到运行于 Electron 时改用**原生文件对话框**选字幕（Web 端仍走上传）。最终用 electron-builder 封装成**一个可双击的 `SubtitlePlayer.exe`**。

### 一次性环境准备

```powershell
# 1) Python 端：打包工具（已在根 pyproject.toml 的 dev 依赖）
uv sync

# 2) Node 端：进入桌面工程安装 Electron 依赖（首次较慢，建议用国内镜像）
cd subtitle_player/desktop
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install --registry=https://registry.npmmirror.com
```

### 开发态运行（不打包，热改前后端）

```powershell
# 需本机已装 uv/Python；Electron 会用 uv 运行源码后端
cd subtitle_player/desktop
npm start
```

### 打包成单 exe

```powershell
# 第一步：在【项目根】用 PyInstaller 把后端打成独立目录 dist/SubtitlePlayer-backend/
uv run pyinstaller --noconfirm subtitle_player/packaging/backend.spec

# 第二步：在 desktop/ 里用 electron-builder 封装为单文件 portable exe
cd subtitle_player/desktop
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm run dist
```

产物：`subtitle_player/desktop/release/SubtitlePlayer.exe`（约 345MB，双击即用）。

> 打包采用 `compression: store`（不压缩）。若改回压缩，electron-builder 对这种大体积应用的 7z 压缩可能长时间卡住，故默认关闭压缩，换更快、更稳的构建。

### `.env` 可选兜底（桌面版）

**不必配置 `.env`**，在 ⚙ 设置里填 URL/Key 即可。若希望团队统一默认值，可选用 `.env`，查找优先级：

1. `exe 同目录/.env`
2. `%APPDATA%\SubtitlePlayer\.env`
3. 项目根 `.env`（仅开发态）

```powershell
Copy-Item .\.env "$env:APPDATA\SubtitlePlayer\.env"   # 可选
```

上传文件与 `translate_config.json` 统一存到 `%APPDATA%\SubtitlePlayer\`。

---

## 项目结构

```
subtitle_player/
├── run.py                  # 启动入口（直接 import app 传给 uvicorn，兼容 PyInstaller）
├── backend/
│   ├── app.py              # FastAPI：静态托管 + API 路由
│   ├── parser.py           # 字幕解析：funasr .txt / .srt / .vtt → Segment
│   ├── translator.py       # LLM 批量翻译 + .bilingual.json 缓存（SSE 进度）
│   ├── translate_config.py # 翻译模型参数（页面可配 + JSON 持久化到用户数据目录）
│   ├── paths.py            # 资源根/用户数据目录/.env 加载（适配开发态与 PyInstaller 冻结态）
│   └── models.py           # Segment / Subtitle 数据结构
├── frontend/
│   ├── index.html          # 页面骨架
│   ├── style.css           # 护眼主题 + 跑马灯样式
│   ├── i18n.js             # 界面文案（默认英文，可切中文）
│   └── app.js              # 播放引擎（计时/滚动/逐字高亮/控件/翻译 + Electron 原生对话框分支）
├── desktop/                # Electron 桌面客户端外壳
├── packaging/backend.spec    # PyInstaller 配置
├── mockup.html             # 离线交互原型
├── .env.example
├── LICENSE
├── CONTRIBUTING.zh-CN.md
└── CHANGELOG.md
```

---

## API 一览

| 接口 | 说明 |
|------|------|
| `GET /` | 前端页面 |
| `GET /api/health` | 探活；返回 `llm` 是否可用 |
| `POST /api/subtitle/upload` | 上传本地字幕文件（multipart），解析并返回字幕数据 |
| `GET /api/subtitle?path=` | 解析字幕（命中缓存则带译文） |
| `GET /api/translate-config` | 读取翻译参数（含 .env 与用户覆盖） |
| `PUT /api/translate-config` | 保存翻译参数（JSON body） |
| `POST /api/translate-config/reset` | 恢复 .env 默认（删除用户覆盖） |
| `GET /api/translate?path=` | SSE 流式翻译并写缓存 |

详细说明见 [docs/API.zh-CN.md](docs/API.zh-CN.md)。

---

## 配色说明（护眼为核心）

| 变量 | 米黄护眼 | 暗色护眼 |
|------|---------|---------|
| 背景 | `#ECE6D6` | `#20242A` |
| 高亮（已点亮文字） | 青绿 `#2E7D6F` | 薄荷绿 `#6FD3BE` |
| 中文文字 | 暖棕 `#8A6D3B` | 暖金 `#D7B783` |

设计原则：避开纯白 `#fff` / 纯黑 `#000`，暖色调、中低对比，长时间阅读不刺眼；当前行最亮且略放大居中，邻行半亮，远行最淡，视线自然聚焦。

---

## 参与贡献

见 [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)（[English](CONTRIBUTING.md)）。

## 许可证

[MIT](LICENSE) © xk

---

## 关键词

`字幕播放器` `双语字幕` `SRT播放器` `VTT字幕` `字幕自动滚动` `卡拉OK字幕` `跑马灯高亮` `FunASR` `语音转文字` `英文字幕翻译` `LLM翻译` `百炼` `通义千问` `英语学习` `播客字幕` `护眼阅读` `提词器` `开源字幕` `Electron桌面` `便携exe` `字幕翻译` `定时字幕` `转写稿阅读` `sse流式翻译` `fastapi` `python`
