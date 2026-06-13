# Subtitle Player

**English** | [简体中文](README.zh-CN.md)

> **Open-source timed subtitle viewer** for `.srt`, `.vtt`, and FunASR `[hh:mm:ss]` `.txt` transcripts — with **auto-scroll**, **karaoke / MTV-style word highlight**, **bilingual EN↔ZH display**, **LLM subtitle translation** (DashScope / Qwen), and a **portable Windows `.exe`**. No video required: practice language listening & reading from transcript files alone.

Load timestamped subtitle files and **simulate timed playback**: auto-scroll, MTV-style word-by-word highlight, bilingual display (English above Chinese in a narrow stacked column), eye-care themes, speed and font-size controls. Chinese translations are generated on demand via LLM and cached locally.

Two deployment modes share the same frontend and backend:

- **Web app** — FastAPI local server, open in a browser (development and debugging).
- **Desktop client (Electron)** — packaged as a single **`SubtitlePlayer.exe`** with an embedded Python backend; no separate install.

---

## Overview

Subtitle Player is a **local-first subtitle reader and karaoke-style lyric viewer**. It is built for people who already have a transcript (from FunASR, Whisper, podcast STT, course videos, etc.) and want to **read along on a timer** without opening a video player.

**Also known as / related searches:** subtitle scroll player · timed transcript reader · bilingual subtitle tool · SRT/VTT viewer · karaoke lyrics highlighter · English podcast subtitle translator · FunASR transcript player · eye-care subtitle reading · language-learning subtitle app · Electron subtitle desktop app · portable subtitle exe.

**Tech stack:** Python · FastAPI · uvicorn · vanilla JavaScript · Electron · PyInstaller · SSE streaming · DashScope (OpenAI-compatible) · MIT license.

---

## Use Cases

| Scenario | How Subtitle Player helps |
|----------|---------------------------|
| **Language learning** | Read English podcasts / lectures with auto-scroll; generate Chinese side-by-side while you follow the timer. |
| **FunASR / STT output** | Open `[hh:mm:ss] text` `.txt` from speech recognition; no need to convert to SRT first. |
| **Bilingual review** | Switch **Bilingual / English / Chinese**; cache translations in `.bilingual.json` for offline reuse. |
| **Long-screen reading** | Warm cream & dark eye-care themes; adjustable font size; current line centered like teleprompter / lyrics apps. |
| **No-video workflow** | Timer-only playback when you only have subtitles, not the original media file. |
| **Windows desktop** | Single portable `SubtitlePlayer.exe` — double-click, pick a file, no Python install for end users. |
| **Developer / self-host** | Run `uv run python subtitle_player/run.py` locally; REST + SSE API for custom integrations. |

---

## FAQ

**Does it play video or audio?**  
No. It is a **subtitle-only simulated player** driven by timestamps. Use it when you want scroll + highlight without syncing to media.

**Which subtitle formats are supported?**  
`.srt`, `.vtt`, and FunASR-style `.txt` with `[hh:mm:ss]` or `[mm:ss]` prefixes.

**Can it translate English subtitles to Chinese?**  
Yes. Configure `DASHSCOPE_API_KEY` (or compatible API in `.env`). Translation streams via SSE while you play; results cache next to the source file.

**Does it work offline?**  
Playback and cached `.bilingual.json` work offline. New LLM translation needs network + API key.

**FunASR timestamps only have start times — is karaoke accurate?**  
End times are inferred from the next line; highlight timing is **character-linear** within each segment — great visual karaoke, not word-level forced alignment.

**Web vs Electron desktop?**  
Same UI. Web uploads files; Electron uses a native file picker. Desktop build embeds the Python backend.

**Is this free and open source?**  
Yes — [MIT License](LICENSE). Part of the `xk-knowledge-base` monorepo under `subtitle_player/`.

---
## Features

| Feature | Description |
|---------|-------------|
| Load subtitles | funasr `[hh:mm:ss] text` `.txt`, standard `.srt` / `.vtt` |
| View modes | Bilingual (EN on top, ZH below), English only, Chinese only; desktop window fixed at 450px width |
| Simulated playback | Timer-driven (no audio); current line centered with smooth auto-scroll |
| Karaoke highlight | Current line lights up word-by-word left to right |
| Speed | 0.5× – 2× |
| Font size | 16 – 40 px, live update |
| Eye-care themes | Default warm cream; one-click dark eye-care mode (no pure white/black) |
| Translation | Streaming SSE: translate while playing; untranslated segments show a placeholder; incremental cache for resume |

> **Timestamps:** funasr `.txt` lines only have start times. This tool fills end times from the next line’s start; the last line uses the “audio duration” from stats. Karaoke timing is linearly interpolated by character count within each segment — good for the marquee effect, not word-level precision.

---

## Quick Start

```powershell
# From the repository root (deps in root pyproject.toml: fastapi / uvicorn)
uv run python subtitle_player/run.py
```

The browser opens at `http://127.0.0.1:8800`.

### Desktop shortcut (Windows)

Double-click the desktop shortcut **Subtitle Player**, or run:

```powershell
powershell -ExecutionPolicy Bypass -File subtitle_player/create_desktop_shortcut.ps1
```

Or double-click `subtitle_player/launch.bat`.

**CLI flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--host` | `127.0.0.1` | Bind address |
| `--port` | `8800` | Port |
| `--no-open` | off | Do not open the browser |

```powershell
uv run python subtitle_player/run.py --port 9000 --no-open
```

---

## Usage

1. Click **Choose file…** → pick a `.txt` / `.srt` / `.vtt` → click **Load**.
2. Press ▶ or **Space** to play/pause.
3. Click any subtitle line to seek; drag or click the progress bar.
4. Top bar: switch **Bilingual / English / Chinese**; **⚙** translation settings; **🌗** theme; **EN/中** UI language.
5. For English-only subtitles: click **Generate Chinese translation**, or **press Play** (translation starts automatically). Untranslated lines show a placeholder until ready.

### Shortcuts

| Action | Key |
|--------|-----|
| Play / Pause | `Space` |

---

## Translation

- Uses **Alibaba Cloud DashScope** (OpenAI-compatible API). Default model: `qwen3.6-flash`.
- API key and base URL: project root `.env` (see [`.env.example`](.env.example)); model parameters can be changed in the **⚙ Settings** UI (saved to the user data directory).

| Variable | Description |
|----------|-------------|
| `DASHSCOPE_OPENAI_BASE_URL` | DashScope compatible endpoint (default `https://dashscope.aliyuncs.com/compatible-mode/v1`) |
| `DASHSCOPE_API_KEY` | DashScope API key |
| `TRANSLATE_MODEL` | Default model `qwen3.6-flash` (overridable in UI) |

UI parameters: `model`, `temperature` (0–2), `max_tokens` (256–16384), `batch_size` (1–32, default 16).

Priority: `TRANSLATE_BASE_URL` / `TRANSLATE_API_KEY` → `DASHSCOPE_*` → generic `get_llm_config()` fallback.

DashScope calls **ignore system proxies** (`HTTP(S)_PROXY` / `ALL_PROXY`) for direct domestic access.

Without API config, English playback still works; translation is disabled (banner explains why).

Translations cache as `xxx.bilingual.json` next to the subtitle file. Delete to force re-translation. Chinese source subtitles get English in the EN column.

Restart the server after changing **API key / base URL** in `.env`; model parameters apply immediately after saving in ⚙.

---

## Desktop Client & Packaging (Electron + PyInstaller → single exe)

The desktop build wraps the web app in Electron: the main process picks a free port, starts the embedded Python backend, waits for `/api/health`, then loads the local URL. In Electron, file picking uses a **native dialog** (web upload otherwise). `electron-builder` produces **`SubtitlePlayer.exe`**.

### One-time setup

```powershell
# 1) Python packaging tools (dev deps in root pyproject.toml)
uv sync

# 2) Node / Electron (first run is slow; mirrors recommended in China)
cd subtitle_player/desktop
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install --registry=https://registry.npmmirror.com
```

### Development (no packaging)

```powershell
cd subtitle_player/desktop
npm start
```

### Build portable exe

```powershell
# Step 1 — from repo root: PyInstaller backend → dist/SubtitlePlayer-backend/
uv run pyinstaller --noconfirm subtitle_player/packaging/backend.spec

# Step 2 — electron-builder single-file portable exe
cd subtitle_player/desktop
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm run dist
```

Output: `subtitle_player/desktop/release/SubtitlePlayer.exe` (~345 MB).

> Build uses `compression: store` (no compression). Re-enabling 7z compression can hang on large apps; store is faster and more reliable.

### `.env` for packaged exe

The portable exe is not in the repo tree. `.env` lookup order:

1. Same directory as the exe
2. `%APPDATA%\SubtitlePlayer\.env` ← **recommended** (portable exe extracts to a temp dir each run)
3. Project root `.env` (development only)

```powershell
Copy-Item .\.env "$env:APPDATA\SubtitlePlayer\.env"
```

Uploads and `translate_config.json` also live under `%APPDATA%\SubtitlePlayer\`.

---

## Project Structure

```
subtitle_player/
├── run.py                  # Entry (imports app for uvicorn + PyInstaller)
├── backend/
│   ├── app.py              # FastAPI: static files + API routes
│   ├── parser.py           # funasr .txt / .srt / .vtt → Segment
│   ├── translator.py       # LLM batch translate + .bilingual.json cache (SSE)
│   ├── translate_config.py # Model params (UI + JSON in user data dir)
│   ├── paths.py            # Resource / user data / .env (dev + frozen)
│   └── models.py           # Segment / Subtitle types
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── i18n.js             # UI strings (en default, zh)
│   └── app.js              # Playback, scroll, highlight, translation
├── desktop/                # Electron shell
├── packaging/backend.spec  # PyInstaller spec
├── mockup.html             # Offline UI prototype
├── .env.example
├── LICENSE
├── CONTRIBUTING.md
└── CHANGELOG.md
```

---

## API

| Endpoint | Description |
|----------|-------------|
| `GET /` | Frontend page |
| `GET /api/health` | Health check; `llm` availability |
| `POST /api/subtitle/upload` | Upload subtitle (multipart) |
| `GET /api/subtitle?path=` | Parse subtitle (includes cache if present) |
| `GET /api/translate-config` | Read translation settings |
| `PUT /api/translate-config` | Save translation settings |
| `POST /api/translate-config/reset` | Reset to `.env` defaults |
| `GET /api/translate?path=` | SSE streaming translation |

See [docs/API.md](docs/API.md) for request/response details.

---

## Eye-care Color Palette

| Token | Warm cream | Dark eye-care |
|-------|------------|---------------|
| Background | `#ECE6D6` | `#20242A` |
| Highlight | `#2E7D6F` | `#6FD3BE` |
| Chinese text | `#8A6D3B` | `#D7B783` |

Avoids pure `#fff` / `#000`; warm tones and moderate contrast for long reading sessions.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) ([中文](CONTRIBUTING.zh-CN.md)).

## License

[MIT](LICENSE) © xk

---

## Keywords

`subtitle-player` `subtitle-viewer` `srt-player` `vtt-player` `bilingual-subtitles` `karaoke-lyrics` `auto-scroll-subtitles` `timed-transcript` `funasr` `speech-to-text` `english-chinese-translation` `llm-translation` `dashscope` `qwen` `language-learning` `podcast-transcript` `eye-care-reading` `electron-app` `fastapi` `python` `open-source` `windows-portable-exe` `subtitle-translation` `lyric-highlight` `teleprompter` `sse-streaming`
