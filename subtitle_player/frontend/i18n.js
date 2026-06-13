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
        "Configure API key and base URL in project root <code>.env</code>; adjust model and generation params here. Changes apply immediately after save.",
      settingsHintDesktop:
        "Configure API key in <code>%APPDATA%\\SubtitlePlayer\\.env</code>; adjust model and generation params here. Changes apply immediately after save.",
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
        "Restored {done}/{total} {target} translations ({pct}%) from cache; DashScope not configured, cannot continue.",
      cacheNoneNoLlm:
        "No {target} translation yet; DashScope not configured (set DASHSCOPE_API_KEY in .env), auto-translate disabled.",
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
      saveFailed: "Save failed: {msg}",
      saveOk: "Translation settings saved; applies on next translation",
      resetOk: "Reset to .env defaults",
      resetFailed: "Reset failed: {msg}",
      settingsMetaEndpoint: "Endpoint",
      settingsMetaApiKey: "API Key",
      settingsMetaTranslate: "Translation",
      settingsMetaConfigured: "configured",
      settingsMetaNotConfigured: "not configured",
      settingsMetaAvailable: "available",
      settingsMetaUnavailable: "unavailable",
      settingsMetaUserOverride: "Using custom UI parameters",
      settingsMetaEnvDefault: "Default model from .env ({model}) when not customized",
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
        "API Key 与接口地址请在项目根 <code>.env</code> 配置；此处可调整模型与生成参数，保存后立即生效。",
      settingsHintDesktop:
        "API Key 请在 <code>%APPDATA%\\SubtitlePlayer\\.env</code> 配置；此处可调整模型与生成参数，保存后立即生效。",
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
        "已从缓存恢复 {done}/{total} 段{target}译文（{pct}%）；未检测到百炼配置，无法继续翻译。",
      cacheNoneNoLlm:
        "该字幕暂无{target}译文；未检测到百炼配置（.env 的 DASHSCOPE_API_KEY），无法自动翻译。",
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
      saveFailed: "保存失败：{msg}",
      saveOk: "翻译参数已保存，下次翻译立即生效",
      resetOk: "已恢复为 .env 默认",
      resetFailed: "恢复失败：{msg}",
      settingsMetaEndpoint: "接口",
      settingsMetaApiKey: "API Key",
      settingsMetaTranslate: "翻译",
      settingsMetaConfigured: "已配置",
      settingsMetaNotConfigured: "未配置",
      settingsMetaAvailable: "可用",
      settingsMetaUnavailable: "不可用",
      settingsMetaUserOverride: "当前使用页面自定义参数",
      settingsMetaEnvDefault: "未自定义时模型默认读 .env（{model}）",
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
