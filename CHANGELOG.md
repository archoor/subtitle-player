# Changelog

All notable changes to **Subtitle Player** are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.0.2] - 2026-06-13

### Changed

- **Settings panel-first configuration:** Base URL, API Key, and model are editable in ⚙ Settings and saved locally; `.env` is now optional fallback only.
- API Key is masked in responses; blank on save keeps the existing key.
- Banner and docs updated to guide users to the settings panel instead of requiring `.env`.

## [0.0.1] - 2026-06-13

### Added

- Initial public release on GitHub ([archoor/subtitle-player](https://github.com/archoor/subtitle-player)).
- Web app (FastAPI) and Electron portable desktop client.
- Subtitle formats: funasr `.txt`, `.srt`, `.vtt`.
- Karaoke-style highlight, bilingual view, eye-care themes.
- LLM translation (DashScope / Qwen) with SSE streaming and cache.
- English documentation (default) with Chinese variants; UI i18n (EN/中).
- Open-source docs, `LICENSE` (MIT), `.env.example`, API reference.

[Unreleased]: https://github.com/archoor/subtitle-player/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/archoor/subtitle-player/releases/tag/v0.0.2
[0.0.1]: https://github.com/archoor/subtitle-player/releases/tag/v0.0.1
