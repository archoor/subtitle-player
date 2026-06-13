# Contributing to Subtitle Player

**English** | [简体中文](CONTRIBUTING.zh-CN.md)

Thank you for your interest in contributing. This project lives inside the `xk-knowledge-base` monorepo under `subtitle_player/`.

## Development Setup

### Prerequisites

- [uv](https://docs.astral.sh/uv/) and Python ≥ 3.13 (see root `pyproject.toml`)
- For desktop builds: Node.js 18+ and npm

### Run the web app

```powershell
# From repository root
uv sync
uv run python subtitle_player/run.py
```

Open `http://127.0.0.1:8800`. Use `--no-open` to skip the browser launch.

### Run the Electron shell (development)

```powershell
cd subtitle_player/desktop
npm install
npm start
```

Requires `uv` on PATH; Electron spawns `uv run python subtitle_player/run.py`.

### Translation during development

Copy `subtitle_player/.env.example` to the repo root `.env` and set `DASHSCOPE_API_KEY`, or use any OpenAI-compatible endpoint via the fallback vars documented in `.env.example`.

## Project Layout

| Path | Role |
|------|------|
| `backend/` | FastAPI routes, parsing, translation |
| `frontend/` | Static UI (`index.html`, `app.js`, `i18n.js`) |
| `desktop/` | Electron main/preload process |
| `packaging/` | PyInstaller spec for embedded backend |

## Code Guidelines

- Match existing style: minimal scope, no over-abstraction.
- Python: use `uv` for dependencies; add packages at the **repo root** `pyproject.toml`.
- Frontend: vanilla JS, no bundler; keep strings in `i18n.js` for both `en` and `zh`.
- Comments: English for public/open-source surfaces; Chinese is fine for internal notes if already present.

## Documentation

- Default language: **English** (`README.md`, `docs/API.md`, `CONTRIBUTING.md`).
- Chinese variants: `*.zh-CN.md` with cross-links at the top.
- Update `CHANGELOG.md` under `[Unreleased]` for user-visible changes.

## Pull Requests

1. Fork / branch from the main development line of the parent repo.
2. Keep changes focused; one feature or fix per PR when possible.
3. Manually test: load a subtitle, play/pause, seek, translation banner, theme toggle, UI language switch.
4. For desktop changes, run `npm start` in `desktop/` before packaging.

## Reporting Issues

Include:

- OS and version
- Web vs Electron
- Subtitle format (`.txt` / `.srt` / `.vtt`)
- Steps to reproduce and expected vs actual behavior
- Redact API keys and file paths with personal data

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
