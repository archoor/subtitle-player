/* ============================================================
   字幕播放工具 前端逻辑
   - 加载字幕（/api/subtitle）
   - 模拟按时间播放：计时器 + 自动滚动 + 当前行整段高亮
   - 速度 / 字号 / 视图（双语·英·中）调节
   - 中文译文按需生成（/api/translate，SSE 流式进度）
   ============================================================ */

const $ = (id) => document.getElementById(id);

// ---------- 布局：字幕区上下留白随中间区域高度动态调整 ----------
function syncLayout() {
  const main = document.querySelector(".main");
  if (!main) return;
  const h = main.clientHeight;
  // 约 42% 高度作上下留白，使当前行可滚到视口中间；最小值随屏宽变化（--stage-pad-min）
  const minPad = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--stage-pad-min")) || 80;
  const pad = Math.max(minPad, Math.round(h * 0.42));
  document.documentElement.style.setProperty("--stage-pad", pad + "px");
}

// ---------- 状态 ----------
let state = {
  path: "",
  srcLang: "en",
  duration: 0,
  translated: false,
  llm: false,
  segs: [],         // [{start,end,en,zh}]
};
let t = 0, playing = false, speed = 1, lastTs = null, curIdx = -1;
let translateEs = null;
let translateRunning = false;
let translateAbortSilent = false;
const IS_DESKTOP = !!(window.desktop && window.desktop.isElectron);
const t = (key, params) => I18n.t(key, params);

function pendingText() { return I18n.pendingText; }

function targetField() { return state.srcLang === "en" ? "zh" : "en"; }

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ---------- 工具 ----------
function fmt(sec) {
  sec = Math.max(0, Math.floor(sec));
  return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
}
function toast(msg, ms = 2200) {
  const el = $("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), ms);
}

/** 构建某一语言列的 HTML */
function lineContent(field, text) {
  const tf = targetField();
  if (text) {
    return { html: escapeHtml(text), untranslated: false };
  }
  if (field === tf) {
    return { html: `<span class="pending-text">${escapeHtml(pendingText())}</span>`, untranslated: true };
  }
  return { html: "", untranslated: false };
}

// ---------- 渲染字幕 ----------
const stage = $("stage");
let segEls = [];

function renderSubtitle() {
  stage.innerHTML = "";
  segEls = [];
  state.segs.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "seg";
    div.dataset.i = i;
    fillSegEl(div, s);
    div.addEventListener("click", () => seek(s.start + 0.01));
    stage.appendChild(div);
    segEls.push(div);
  });
  curIdx = -1;
  render();
  syncLayout();
}

/** 填充/刷新单行字幕 DOM */
function fillSegEl(el, s) {
  const enC = lineContent("en", s.en);
  const zhC = lineContent("zh", s.zh);
  el.innerHTML = `
    <div class="en line${enC.untranslated ? " untranslated" : ""}">${enC.html}</div>
    <div class="zh line${zhC.untranslated ? " untranslated" : ""}">${zhC.html}</div>`;
}

function updateSegEl(i) {
  const el = segEls[i];
  if (!el || !state.segs[i]) return;
  fillSegEl(el, state.segs[i]);
}

// ---------- 播放引擎 ----------
function render() {
  if (!state.segs.length) {
    $("time").textContent = "00:00 / 00:00";
    return;
  }
  let idx = state.segs.findIndex((s) => t >= s.start && t < s.end);
  if (idx === -1) idx = t >= state.duration ? state.segs.length - 1 : 0;

  if (idx !== curIdx) {
    segEls.forEach((el, i) => {
      el.classList.toggle("active", i === idx);
      el.classList.toggle("near", Math.abs(i - idx) === 1);
      el.classList.toggle("past", i < idx);
    });
    curIdx = idx;
    segEls[idx].scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const pct = state.duration ? Math.min(100, (t / state.duration) * 100) : 0;
  $("bar").style.width = pct + "%";
  $("knob").style.left = pct + "%";
  $("time").textContent = fmt(t) + " / " + fmt(state.duration);
}

function loop(ts) {
  if (!playing) return;
  if (lastTs == null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;
  t += dt * speed;
  if (t >= state.duration) { t = state.duration; playing = false; $("playBtn").textContent = "▶"; }
  render();
  if (playing) requestAnimationFrame(loop);
}
function play() {
  if (playing || !state.segs.length) return;
  maybeStartTranslate();
  playing = true; lastTs = null; $("playBtn").textContent = "⏸";
  requestAnimationFrame(loop);
}
function pause() { playing = false; $("playBtn").textContent = "▶"; }
function seek(sec) {
  t = Math.min(state.duration, Math.max(0, sec));
  curIdx = -1; render();
}

// ---------- 加载字幕 ----------
async function onFilePicked(e) {
  const file = e.target.files?.[0];
  e.target.value = "";   // 允许重复选同一文件
  if (!file) return;
  await uploadAndLoad(file);
}

function applySubtitleData(data) {
  state.path = data.source_file;
  state.srcLang = data.src_lang;
  state.duration = data.duration;
  state.translated = data.translated;
  state.llm = data.llm;
  state.segs = data.segments;
  if (data.display_name) $("filePath").value = data.display_name;

  $("empty").style.display = "none";
  $("playBtn").disabled = false;
  pause(); t = 0;
  renderSubtitle();
  seek(0);
  updateBanner();
  toast(buildLoadToast());
}

/** 加载完成时的提示文案（含断点续译进度） */
function buildLoadToast() {
  const lang = I18n.srcLangLabel(state.srcLang);
  const n = state.segs.length;
  const { done, total, pending, pct } = translationStats();
  if (state.translated) {
    return t("loadSegmentsTranslated", { n, lang });
  }
  if (done > 0 && pending > 0) {
    return t("loadSegmentsPartial", { n, lang, done, total, pct });
  }
  return t("loadSegments", { n, lang });
}

async function uploadAndLoad(file) {
  abortTranslate({ silent: true });
  toast(t("uploading"));
  const fd = new FormData();
  fd.append("file", file, file.name);
  try {
    const res = await fetch("/api/subtitle/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.error) { toast(t("loadFailed", { msg: data.error }), 4000); return; }
    applySubtitleData(data);
  } catch (e) {
    toast(t("loadFailed", { msg: e.message }), 4000);
  }
}

/** 桌面客户端：用原生对话框选文件，选中后立即加载。 */
async function pickViaDesktop() {
  const p = await window.desktop.pickSubtitle();
  if (!p) return;
  $("filePath").value = p.replace(/^.*[\\/]/, "");   // 先展示文件名
  await loadByPath(p);
}

/** 桌面客户端：按绝对路径解析（GET /api/subtitle?path=）。 */
async function loadByPath(path) {
  abortTranslate({ silent: true });
  toast(t("parsing"));
  try {
    const res = await fetch("/api/subtitle?path=" + encodeURIComponent(path));
    const data = await res.json();
    if (data.error) { toast(t("loadFailed", { msg: data.error }), 4000); return; }
    applySubtitleData(data);
  } catch (e) {
    toast(t("loadFailed", { msg: e.message }), 4000);
  }
}

// ---------- 翻译（SSE 流式：逐段推送，边译边播） ----------
function translationStats() {
  const tf = targetField();
  const total = state.segs.length;
  const done = state.segs.filter((s) => s[tf]).length;
  const pending = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, total, pending, pct };
}

function needTranslation() {
  return translationStats().pending > 0;
}

function abortTranslate({ silent = false } = {}) {
  translateAbortSilent = silent;
  if (translateEs) { translateEs.close(); translateEs = null; }
  translateRunning = false;
}

function maybeStartTranslate() {
  if (translateRunning || state.translated || !state.llm || !needTranslation()) return;
  doTranslate();
}

function setTranslateProgressBar(done, total) {
  const progEl = $("bannerProg").firstElementChild;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progEl.style.width = pct + "%";
}

function setTranslateProgressActive() {
  const { done, total, pending } = translationStats();
  setTranslateProgressBar(done, total);
  $("bannerText").textContent = t("translating", {
    done, total, pending, pendingText: pendingText(),
  });
}

function updateBanner() {
  const banner = $("banner");
  if (!state.segs.length) {
    banner.classList.remove("show");
    syncLayout();
    return;
  }
  if (state.translated && !translateRunning) {
    banner.classList.remove("show");
    syncLayout();
    return;
  }
  const targetName = I18n.targetLangLabel(state.srcLang);
  const { done, total, pending, pct } = translationStats();
  const pt = pendingText();

  if (!state.llm) {
    if (done > 0) {
      $("bannerText").textContent = t("cachePartialNoLlm", { done, total, target: targetName, pct });
      $("bannerProg").style.display = "";
      setTranslateProgressBar(done, total);
    } else {
      $("bannerText").textContent = t("cacheNoneNoLlm", { target: targetName });
      $("bannerProg").style.display = "none";
    }
    $("translateBtn").style.display = "none";
  } else if (translateRunning) {
    setTranslateProgressActive();
    $("translateBtn").style.display = "";
    $("translateBtn").disabled = true;
    $("translateBtn").textContent = t("translatingBtn");
    $("bannerProg").style.display = "";
  } else if (done > 0 && pending > 0) {
    $("bannerText").textContent = t("cachePartial", {
      done, total, target: targetName, pct, pending, pendingText: pt,
    });
    $("translateBtn").style.display = "";
    $("translateBtn").disabled = false;
    $("translateBtn").textContent = t("continueTranslate", { pending });
    $("bannerProg").style.display = "";
    setTranslateProgressBar(done, total);
  } else {
    $("bannerText").textContent = t("noTranslation", { target: targetName, pendingText: pt });
    $("translateBtn").style.display = "";
    $("translateBtn").disabled = false;
    $("translateBtn").textContent = t("generateTarget", { target: targetName });
    $("bannerProg").style.display = "none";
  }
  banner.classList.add("show");
  syncLayout();
}

function doTranslate() {
  if (!state.path || !state.llm || translateRunning) return;
  translateRunning = true;
  updateBanner();

  translateEs = new EventSource("/api/translate?path=" + encodeURIComponent(state.path));
  const tf = targetField();

  translateEs.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }

    if (msg.type === "progress" || msg.type === "segment") {
      if (msg.type === "segment") {
        const i = msg.index;
        if (msg[tf]) {
          state.segs[i][tf] = msg[tf];
          updateSegEl(i);
        }
      }
      setTranslateProgressActive();
    } else if (msg.type === "error") {
      toast(t("translateError", { msg: msg.message }), 4000);
    } else if (msg.type === "done") {
      state.translated = msg.translated;
      translateRunning = false;
      translateEs.close();
      translateEs = null;
      updateBanner();
      if (msg.translated) toast(t("translateDone"));
      else {
        const { done, total } = translationStats();
        toast(t("translatePaused", { done, total }), 3500);
      }
    }
  };

  translateEs.onerror = () => {
    const silent = translateAbortSilent;
    translateAbortSilent = false;
    abortTranslate();
    updateBanner();
    if (!silent) toast(t("translateDisconnected"), 3000);
  };
}

// ---------- 控件绑定 ----------
$("playBtn").onclick = () => (playing ? pause() : play());
$("pickBtn").onclick = () => (IS_DESKTOP ? pickViaDesktop() : $("fileInput").click());
$("fileInput").addEventListener("change", onFilePicked);
$("translateBtn").onclick = doTranslate;

function seekFromProgressClientX(clientX) {
  if (!state.duration) return;
  const rect = $("progress").getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  seek(ratio * state.duration);
}

let draggingProgress = false;
let resumeAfterDrag = false;

$("progress").addEventListener("pointerdown", (e) => {
  if (!state.duration) return;
  draggingProgress = true;
  resumeAfterDrag = playing;
  pause();
  $("progress").setPointerCapture(e.pointerId);
  seekFromProgressClientX(e.clientX);
  e.preventDefault();
});

$("progress").addEventListener("pointermove", (e) => {
  if (!draggingProgress) return;
  seekFromProgressClientX(e.clientX);
});

function endProgressDrag(e) {
  if (!draggingProgress) return;
  draggingProgress = false;
  try { $("progress").releasePointerCapture(e.pointerId); } catch (_) { /* already released */ }
  if (resumeAfterDrag) play();
  resumeAfterDrag = false;
}

$("progress").addEventListener("pointerup", endProgressDrag);
$("progress").addEventListener("pointercancel", endProgressDrag);
$("speed").oninput = (e) => {
  speed = parseFloat(e.target.value);
  $("speedVal").textContent = speed.toFixed(2) + "x";
};
$("font").oninput = (e) => {
  document.body.style.setProperty("--fs", e.target.value + "px");
  $("fontVal").textContent = e.target.value;
};
$("viewToggle").addEventListener("click", (e) => {
  const btn = e.target.closest("button"); if (!btn) return;
  applyView(btn.dataset.view);
});

/** 切换视图：更新布局（双语=英上中下堆叠 / 英 / 中，窗口固定 450）、必要时提示译文。 */
function applyView(view) {
  document.body.dataset.view = view;
  [...$("viewToggle").children].forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  if (IS_DESKTOP && window.desktop.setViewWidth) window.desktop.setViewWidth(view);
  if ((view === "zh" || view === "both") && needTranslation()) updateBanner();
}
$("themeBtn").onclick = () => {
  document.body.dataset.theme = document.body.dataset.theme === "dark" ? "light" : "dark";
};

// ---------- 翻译模型设置 ----------
let translateConfig = null;

async function fetchTranslateConfig() {
  const res = await fetch("/api/translate-config");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function fillSettingsForm(cfg) {
  $("cfgBaseUrl").value = cfg.base_url || "";
  $("cfgApiKey").value = "";
  $("cfgApiKey").placeholder = cfg.api_key_configured
    ? (cfg.api_key_hint ? t("cfgApiKeyKeepPlaceholder") + " " + cfg.api_key_hint : t("cfgApiKeyKeepPlaceholder"))
    : t("cfgApiKeyPlaceholder");
  $("cfgModel").value = cfg.model || "";
  $("cfgTemperature").value = cfg.temperature ?? 0.3;
  $("cfgTemperatureVal").textContent = Number(cfg.temperature ?? 0.3).toFixed(2);
  $("cfgMaxTokens").value = cfg.max_tokens ?? 4096;
  $("cfgBatchSize").value = cfg.batch_size ?? 16;
  const keyOk = cfg.api_key_configured;
  const llmOk = cfg.llm_available;
  const sourceLine = cfg.has_user_config
    ? t("settingsMetaUserOverride")
    : cfg.env_configured
      ? t("settingsMetaEnvDefault")
      : t("settingsMetaPanelDefault");
  $("settingsMeta").innerHTML = [
    `${t("settingsMetaEndpoint")}：<strong>${escapeHtml(cfg.base_url_host || "-")}</strong> (${escapeHtml(cfg.base_url_source || "-")})`,
    `${t("settingsMetaApiKey")}：${keyOk
      ? `<span class="ok">${t("settingsMetaConfigured")}${cfg.api_key_hint ? " " + escapeHtml(cfg.api_key_hint) : ""}</span>`
      : `<span class="warn">${t("settingsMetaNotConfigured")}</span>`}`,
    `${t("settingsMetaTranslate")}：${llmOk
      ? `<span class="ok">${t("settingsMetaAvailable")}</span>`
      : `<span class="warn">${t("settingsMetaUnavailable")}</span>`}`,
    sourceLine,
  ].join("<br>");
}

function readSettingsForm() {
  return {
    base_url: $("cfgBaseUrl").value.trim(),
    api_key: $("cfgApiKey").value.trim(),
    model: $("cfgModel").value.trim(),
    temperature: parseFloat($("cfgTemperature").value),
    max_tokens: parseInt($("cfgMaxTokens").value, 10),
    batch_size: parseInt($("cfgBatchSize").value, 10),
  };
}

function openSettingsModal() { $("settingsModal").hidden = false; }
function closeSettingsModal() { $("settingsModal").hidden = true; }

async function openSettings() {
  try {
    translateConfig = await fetchTranslateConfig();
    fillSettingsForm(translateConfig);
    openSettingsModal();
  } catch (e) {
    toast(t("configReadFailed", { msg: e.message }), 3500);
  }
}

async function saveSettings() {
  const body = readSettingsForm();
  if (!body.model) { toast(t("modelRequired")); return; }
  if (!body.base_url) { toast(t("baseUrlRequired")); return; }
  if (!body.api_key && !translateConfig?.api_key_configured) {
    toast(t("apiKeyRequired"));
    return;
  }
  try {
    const res = await fetch("/api/translate-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      toast(t("saveFailed", { msg: data.error || res.statusText }), 3500);
      return;
    }
    translateConfig = data;
    state.llm = data.llm_available;
    closeSettingsModal();
    toast(t("saveOk"));
    if (state.segs.length) updateBanner();
  } catch (e) {
    toast(t("saveFailed", { msg: e.message }), 3500);
  }
}

async function resetSettings() {
  try {
    const res = await fetch("/api/translate-config/reset", { method: "POST" });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || res.statusText);
    translateConfig = data;
    fillSettingsForm(data);
    toast(t("resetOk"));
  } catch (e) {
    toast(t("resetFailed", { msg: e.message }), 3500);
  }
}

$("settingsBtn").onclick = openSettings;
$("settingsClose").onclick = closeSettingsModal;
$("settingsCancel").onclick = closeSettingsModal;
$("settingsSave").onclick = saveSettings;
$("settingsReset").onclick = resetSettings;
$("cfgTemperature").oninput = (e) => {
  $("cfgTemperatureVal").textContent = parseFloat(e.target.value).toFixed(2);
};
$("settingsModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeSettingsModal();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && !$("settingsModal").hidden) {
    closeSettingsModal();
    return;
  }
  if (!$("settingsModal").hidden) return;
  if (e.code === "Space" && state.segs.length && e.target.tagName !== "INPUT") {
    e.preventDefault(); playing ? pause() : play();
  }
});

// ---------- UI language ----------
$("langBtn").onclick = () => {
  const next = I18n.getLocale() === "zh" ? "en" : "zh";
  I18n.setLocale(next);
  I18n.applyPageI18n();
  if (state.segs.length) {
    state.segs.forEach((s, i) => updateSegEl(i));
    updateBanner();
  }
};

// ---------- 初始化 ----------
render();
syncLayout();
window.addEventListener("resize", syncLayout);
if (typeof ResizeObserver !== "undefined") {
  const mainEl = document.querySelector(".main");
  if (mainEl) new ResizeObserver(syncLayout).observe(mainEl);
}
