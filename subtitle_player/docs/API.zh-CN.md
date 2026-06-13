# API 参考

[English](API.md) | **简体中文**

默认基址：`http://127.0.0.1:8800`。JSON 响应均为 UTF-8。

> 本地**字幕播放器** REST + SSE 接口：上传/解析 `.srt` `.vtt` FunASR `.txt`，流式 LLM 翻译，配置百炼/通义模型。关键词：`字幕API` `双语翻译SSE` `字幕上传` `SRT解析` `转写稿接口`。

## 健康检查

### `GET /api/health`

```json
{ "ok": true, "llm": true }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `ok` | boolean | 服务正常时为 `true` |
| `llm` | boolean | 是否已配置翻译 API |

---

## 字幕

### `POST /api/subtitle/upload`

上传本地字幕（multipart）。

**表单字段：** `file` — 支持 `.txt`、`.srt`、`.vtt`

**成功 (200)：**

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

**错误：** `422` 格式或解析失败。

### `GET /api/subtitle?path={绝对或相对路径}`

解析磁盘上的字幕。相对路径相对于仓库根目录。

响应结构与上传相同；若存在 `*.bilingual.json` 缓存会一并加载。

**错误：** `404` 文件不存在；`422` 解析失败。

---

## 翻译

### `GET /api/translate?path={path}`

SSE 流式接口。每条事件：`data: {JSON}\n\n`

**事件类型：**

| `type` | 载荷 | 说明 |
|--------|------|------|
| `progress` | `{ "done": 16, "total": 100 }` | 批次进度 |
| `segment` | `{ "index": 0, "zh": "..." }` 或 `{ "index": 0, "en": "..." }` | 单段译文 |
| `error` | `{ "message": "..." }` | 致命错误 |
| `done` | `{ "translated": true }` | 结束；缓存已写入 |
| `result` | （遗留） | 与终态相同 |

客户端断开即中止；已译部分会保留在缓存中。

---

## 翻译配置

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

**请求体：**

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

`api_key` 可省略或留空以**保留已保存的 Key**。GET 响应不回传完整 Key（仅 `api_key_configured` 与 `api_key_hint`）。

返回更新后的配置（与 GET 结构相同）。校验失败返回 `422`。

### `POST /api/translate-config/reset`

删除面板覆盖项，回退到 `.env` 或内置默认值。

---

## 静态资源

| 路径 | 文件 |
|------|------|
| `GET /` | `frontend/index.html` |
| `GET /style.css` | `frontend/style.css` |
| `GET /app.js` | `frontend/app.js` |
| `GET /i18n.js` | `frontend/i18n.js` |

---

## 字幕段数据结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `start` | number | 开始时间（秒） |
| `end` | number | 结束时间（秒） |
| `en` | string | 英文 |
| `zh` | string | 中文（未译时为空） |

`src_lang` 为检测到的源语言 `"en"` 或 `"zh"`。

## 缓存文件

与字幕同目录：`{文件名}.bilingual.json`

含完整双语段落。删除后可强制重新翻译。
