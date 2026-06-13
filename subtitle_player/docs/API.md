# API Reference

**English** | [简体中文](API.zh-CN.md)

Base URL: `http://127.0.0.1:8800` (default). All JSON responses use UTF-8.

> REST + SSE API for a **local subtitle player**: upload/parse `.srt` `.vtt` FunASR `.txt`, stream LLM translation, configure DashScope/Qwen models. Keywords: `subtitle API` `bilingual translation SSE` `FastAPI subtitle` `SRT parser` `transcript upload`.

## Health

### `GET /api/health`

```json
{ "ok": true, "llm": true }
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` when the server is up |
| `llm` | boolean | Whether translation API credentials are configured |

---

## Subtitle

### `POST /api/subtitle/upload`

Upload a local subtitle file (multipart form).

**Form field:** `file` — `.txt`, `.srt`, or `.vtt`

**Success (200):**

```json
{
  "source_file": "/path/to/cached/file.txt",
  "display_name": "original-name.txt",
  "src_lang": "en",
  "duration": 3600.5,
  "translated": false,
  "llm": true,
  "segments": [
    { "start": 0.0, "end": 3.2, "en": "Hello", "zh": "" }
  ]
}
```

**Errors:** `422` invalid format or parse error; `404` not used for upload.

### `GET /api/subtitle?path={absolute_or_relative_path}`

Parse a subtitle on disk. Relative paths resolve from the repository root.

Response shape matches upload. Loads `*.bilingual.json` cache when present.

**Errors:** `404` file not found; `422` parse error.

---

## Translation

### `GET /api/translate?path={path}`

Server-Sent Events stream. Each event: `data: {JSON}\n\n`

**Event types:**

| `type` | Payload | Description |
|--------|---------|-------------|
| `progress` | `{ "done": 16, "total": 100 }` | Batch progress |
| `segment` | `{ "index": 0, "zh": "..." }` or `{ "index": 0, "en": "..." }` | Single segment translated |
| `error` | `{ "message": "..." }` | Fatal error |
| `done` | `{ "translated": true }` | Stream finished; cache written |
| `result` | (legacy) | Same as terminal state |

Client disconnect aborts the stream; partial cache is retained.

---

## Translation Config

### `GET /api/translate-config`

```json
{
  "model": "qwen3.6-flash",
  "temperature": 0.3,
  "max_tokens": 4096,
  "batch_size": 16,
  "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "base_url_host": "dashscope.aliyuncs.com",
  "base_url_source": "user",
  "api_key_configured": true,
  "api_key_hint": "···abcd",
  "api_key_source": "user",
  "env_configured": false,
  "llm_available": true,
  "has_user_config": true
}
```

### `PUT /api/translate-config`

**Body:**

```json
{
  "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "api_key": "sk-...",
  "model": "qwen3.6-flash",
  "temperature": 0.3,
  "max_tokens": 4096,
  "batch_size": 16
}
```

`api_key` may be omitted or left blank to **keep the previously saved key**. Never returned in GET responses (only `api_key_configured` + `api_key_hint`).

Returns updated config (same shape as GET). `422` on validation error.

### `POST /api/translate-config/reset`

Deletes panel overrides; falls back to `.env` or built-in defaults.

---

## Static Assets

| Path | File |
|------|------|
| `GET /` | `frontend/index.html` |
| `GET /style.css` | `frontend/style.css` |
| `GET /app.js` | `frontend/app.js` |
| `GET /i18n.js` | `frontend/i18n.js` |

---

## Subtitle Segment Model

| Field | Type | Description |
|-------|------|-------------|
| `start` | number | Start time (seconds) |
| `end` | number | End time (seconds) |
| `en` | string | English text |
| `zh` | string | Chinese text (may be empty until translated) |

`src_lang` is `"en"` or `"zh"` based on detected source language.

## Cache File

Adjacent to the subtitle: `{basename}.bilingual.json`

Contains full segment list with both languages. Safe to delete to force re-translation.
