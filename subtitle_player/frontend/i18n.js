/**
 * Subtitle Player UI i18n — English default, Chinese optional.
 * Locale persisted in localStorage key "sp_locale".
 */
(function (global) {
  const STORAGE_KEY = "sp_locale";
  const DEFAULT_LOCALE = "en";

  const STRINGS = {
    en: {
      appTitle: "Subtitle Player",
      brand: "Subtitle Player",
      pickFile: "Choose file…",
      pickFileTitle: "Select a local subtitle file",
      filePlaceholder: "Filename shown after selection",
      fileSelectedTitle: "Selected subtitle file",
      viewBoth: "Bilingual",
      viewEn: "English",
      viewZh: "Chinese",
      settingsTitle: "Translation settings",
      downloadTitle: "Download subtitles",
      downloadZh: "Chinese (.txt)",
      downloadEn: "English (.txt)",
      downloadBoth: "Bilingual (.txt)",
      themeTitle: "Toggle eye-care theme",
      langTitle: "Switch UI language",
      bannerNoTranslation: "No Chinese translation yet.",
      translateGenerateZh: "Generate Chinese translation",
      emptyPick: "Click «Choose file» to pick a subtitle",
      emptyFormats: "Supports funasr .txt / .srt / .vtt",
      speed: "Speed",
      fontSize: "Size",
      settingsModalTitle: "Translation model settings",
      settingsClose: "Close",
      settingsHint:
        "Set Base URL, API Key, and model in this panel (saved locally). Optional <code>.env</code> is used as fallback when fields are empty.",
      downloadNotReady: "Chinese subtitles not complete yet",
      downloadEnNotReady: "English subtitles not complete yet",
      downloadBothNotReady: "Bilingual subtitles not complete yet",
      downloadOk: "Downloaded Chinese subtitles",
      downloadOkEn: "Downloaded English subtitles",
      downloadOkBoth: "Downloaded bilingual subtitles",
      cfgBaseUrl: "Base URL",
      cfgApiKey: "API Key",
      cfgApiKeyNote: "Leave blank to keep the saved key",
      cfgApiKeyPlaceholder: "Enter API key",
      cfgApiKeyKeepPlaceholder: "Saved (leave blank to keep)",
      cfgModel: "Model",
      cfgTemperature: "Temperature",
      cfgMaxTokens: "Max tokens",
      cfgBatchSize: "Batch size",
      cfgBatchNote: "Larger batches are faster but increase retry cost on failure",
      settingsReset: "Reset defaults",
      settingsCancel: "Cancel",
      settingsSave: "Save",
      pendingText: "Not translated yet",
      langEn: "English",
      langZh: "Chinese",
      uploading: "Uploading and parsing…",
      parsing: "Parsing…",
      loadFailed: "Load failed: {msg}",
      loadSegments: "Loaded {n} segments ({lang})",
      loadSegmentsTranslated: "Loaded {n} segments ({lang}, translation complete)",
      loadSegmentsPartial:
        "Loaded {n} segments ({lang}), restored {done}/{total} translations ({pct}%), can continue",
      translating: "Translating… {done}/{total} ({pending} pending, untranslated lines show «{pendingText}»)",
      cachePartialNoLlm:
        "Restored {done}/{total} {target} translations ({pct}%) from cache; API not configured — open ⚙ Settings to add URL & Key.",
      cacheNoneNoLlm:
        "No {target} translation yet; API not configured — open ⚙ Settings (or optional .env fallback).",
      cachePartial:
        "Restored {done}/{total} {target} translations ({pct}%), {pending} remaining. Play while translating; untranslated lines show «{pendingText}».",
      noTranslation:
        "No {target} translation yet. You can translate while playing; untranslated lines show «{pendingText}».",
      translatingBtn: "Translating…",
      continueTranslate: "Continue translation ({pending} segments)",
      generateTarget: "Generate {target} translation",
      translateError: "Translation error: {msg}",
      translateDone: "All translations complete and cached",
      translatePaused: "Translation paused, {done}/{total} segments cached",
      translateDisconnected: "Translation connection lost",
      configReadFailed: "Failed to read config: {msg}",
      modelRequired: "Please enter a model name",
      baseUrlRequired: "Please enter a Base URL",
      apiKeyRequired: "Please enter an API Key",
      saveFailed: "Save failed: {msg}",
      saveOk: "Translation settings saved; applies on next translation",
      resetOk: "Panel settings cleared; using .env or defaults",
      resetFailed: "Reset failed: {msg}",
      settingsMetaEndpoint: "Endpoint",
      settingsMetaApiKey: "API Key",
      settingsMetaTranslate: "Translation",
      settingsMetaConfigured: "configured",
      settingsMetaNotConfigured: "not configured",
      settingsMetaAvailable: "available",
      settingsMetaUnavailable: "unavailable",
      settingsMetaUserOverride: "Using panel settings (panel overrides .env)",
      settingsMetaEnvDefault: "Using .env fallback (no panel overrides)",
      settingsMetaPanelDefault: "Using built-in defaults (configure panel or .env)",
      loadingTitle: "Subtitle Player",
      loadingTip: "Starting local server, please wait…",
    },
    zh: {
      appTitle: "字幕播放工具",
      brand: "字幕播放工具",
      pickFile: "选择文件…",
      pickFileTitle: "选择本地字幕文件",
      filePlaceholder: "选择文件后显示文件名",
      fileSelectedTitle: "已选字幕文件",
      viewBoth: "双语",
      viewEn: "英文",
      viewZh: "中文",
      settingsTitle: "翻译模型设置",
      downloadTitle: "下载字幕",
      downloadZh: "中文字幕 (.txt)",
      downloadEn: "英文字幕 (.txt)",
      downloadBoth: "双语字幕 (.txt)",
      themeTitle: "切换护眼主题",
      langTitle: "切换界面语言",
      bannerNoTranslation: "该字幕暂无中文译文。",
      translateGenerateZh: "生成中文译文",
      emptyPick: "点击「选择文件」挑选字幕",
      emptyFormats: "支持 funasr .txt / .srt / .vtt",
      speed: "速度",
      fontSize: "字号",
      settingsModalTitle: "翻译模型设置",
      settingsClose: "关闭",
      settingsHint:
        "在此面板填写 Base URL、API Key 与模型（保存到本地）。未填写时可选读 <code>.env</code> 作为兜底。",
      downloadNotReady: "中文字幕尚未全部译完",
      downloadEnNotReady: "英文字幕尚未全部译完",
      downloadBothNotReady: "双语字幕尚未全部就绪",
      downloadOk: "已下载中文字幕文件",
      downloadOkEn: "已下载英文字幕文件",
      downloadOkBoth: "已下载双语字幕文件",
      cfgBaseUrl: "接口地址 Base URL",
      cfgApiKey: "API Key",
      cfgApiKeyNote: "留空则保留已保存的 Key",
      cfgApiKeyPlaceholder: "填写 API Key",
      cfgApiKeyKeepPlaceholder: "已保存（留空不修改）",
      cfgModel: "模型",
      cfgTemperature: "Temperature",
      cfgMaxTokens: "Max tokens",
      cfgBatchSize: "每批段数",
      cfgBatchNote: "越大越快，但单次请求越长、失败重试成本越高",
      settingsReset: "恢复默认",
      settingsCancel: "取消",
      settingsSave: "保存",
      pendingText: "还未翻译",
      langEn: "英文",
      langZh: "中文",
      uploading: "上传并解析中…",
      parsing: "解析中…",
      loadFailed: "加载失败：{msg}",
      loadSegments: "已加载 {n} 段（源语言：{lang}）",
      loadSegmentsTranslated: "已加载 {n} 段（{lang}，译文已完整）",
      loadSegmentsPartial:
        "已加载 {n} 段（{lang}），已恢复 {done}/{total} 段译文（{pct}%），可继续翻译",
      translating:
        "翻译中… {done}/{total}（{pending} 段待译，未译段落显示「{pendingText}」）",
      cachePartialNoLlm:
        "已从缓存恢复 {done}/{total} 段{target}译文（{pct}%）；未配置 API，请在 ⚙ 设置中填写接口与 Key。",
      cacheNoneNoLlm:
        "该字幕暂无{target}译文；未配置 API，请打开 ⚙ 设置（或使用可选的 .env 兜底）。",
      cachePartial:
        "已从缓存恢复 {done}/{total} 段{target}译文（{pct}%），剩余 {pending} 段。可边播放边继续翻译，未译段落显示「{pendingText}」。",
      noTranslation:
        "该字幕暂无{target}译文。可边播放边翻译，未译段落显示「{pendingText}」。",
      translatingBtn: "翻译中…",
      continueTranslate: "继续翻译（{pending} 段）",
      generateTarget: "生成{target}译文",
      translateError: "翻译出错：{msg}",
      translateDone: "译文已全部完成并缓存",
      translatePaused: "翻译已暂停，当前 {done}/{total} 段已缓存",
      translateDisconnected: "翻译连接中断",
      configReadFailed: "读取配置失败：{msg}",
      modelRequired: "请填写模型名",
      baseUrlRequired: "请填写接口地址 Base URL",
      apiKeyRequired: "请填写 API Key",
      saveFailed: "保存失败：{msg}",
      saveOk: "翻译参数已保存，下次翻译立即生效",
      resetOk: "已清除面板配置，回退到 .env 或默认值",
      resetFailed: "恢复失败：{msg}",
      settingsMetaEndpoint: "接口",
      settingsMetaApiKey: "API Key",
      settingsMetaTranslate: "翻译",
      settingsMetaConfigured: "已配置",
      settingsMetaNotConfigured: "未配置",
      settingsMetaAvailable: "可用",
      settingsMetaUnavailable: "不可用",
      settingsMetaUserOverride: "当前使用面板配置（优先于 .env）",
      settingsMetaEnvDefault: "当前使用 .env 兜底（面板未覆盖）",
      settingsMetaPanelDefault: "当前使用内置默认（请在面板或 .env 中配置）",
      loadingTitle: "字幕播放工具",
      loadingTip: "正在启动本地服务，请稍候…",
    },
  };

  function normalizeLocale(loc) {
    return loc === "zh" ? "zh" : "en";
  }

  function getLocale() {
    try {
      return normalizeLocale(localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE);
    } catch {
      return DEFAULT_LOCALE;
    }
  }

  function setLocale(loc) {
    const next = normalizeLocale(loc);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    return next;
  }

  /** Replace {key} placeholders in template. */
  function t(key, params) {
    const loc = getLocale();
    let s = (STRINGS[loc] && STRINGS[loc][key]) || STRINGS.en[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.split(`{${k}}`).join(String(v));
      }
    }
    return s;
  }

  /** Apply data-i18n / data-i18n-placeholder / data-i18n-title to static DOM. */
  function applyPageI18n(root) {
    const el = root || document;
    el.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      const html = node.getAttribute("data-i18n-html") === "1";
      if (html) node.innerHTML = t(key);
      else node.textContent = t(key);
    });
    el.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = t(node.getAttribute("data-i18n-placeholder"));
    });
    el.querySelectorAll("[data-i18n-title]").forEach((node) => {
      node.title = t(node.getAttribute("data-i18n-title"));
    });
    document.title = t("appTitle");
    const langBtn = document.getElementById("langBtn");
    if (langBtn) {
      const loc = getLocale();
      langBtn.textContent = loc === "zh" ? "EN" : "中";
      langBtn.title = t("langTitle");
    }
  }

  function srcLangLabel(code) {
    return code === "en" ? t("langEn") : t("langZh");
  }

  function targetLangLabel(srcLang) {
    return srcLang === "en" ? t("langZh") : t("langEn");
  }

  global.I18n = {
    STORAGE_KEY,
    DEFAULT_LOCALE,
    getLocale,
    setLocale,
    t,
    applyPageI18n,
    srcLangLabel,
    targetLangLabel,
    get pendingText() {
      return t("pendingText");
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
