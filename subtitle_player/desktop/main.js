/**
 * Electron 主进程：字幕播放工具桌面客户端外壳。
 *
 * 职责：
 *   1. 选一个空闲端口，启动 Python 后端（开发态 = uv run；打包态 = 内置后端 exe）。
 *   2. 轮询 /api/health 直到后端就绪，期间显示加载页，避免白屏。
 *   3. 后端就绪后窗口加载 http://127.0.0.1:port。
 *   4. 应用退出时彻底结束后端子进程（含子孙进程）。
 *   5. 暴露原生文件选择对话框给渲染进程（preload + IPC）。
 *
 * 开发态运行：  npm start          （需本机已装 uv / Python）
 * 模拟打包态：  npm run start:prod （需先 PyInstaller 打出后端，再设 SP_FORCE_PACKAGED）
 * 出单 exe：    npm run dist
 */

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require("electron");
const { spawn, execFile } = require("child_process");
const path = require("path");
const net = require("net");
const http = require("http");

// subtitle_player/desktop/main.js → 项目根 = 上两级
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const IS_PACKAGED = app.isPackaged || process.env.SP_FORCE_PACKAGED === "1";

let backendProc = null;
let backendPort = 0;
let win = null;

/** 申请一个空闲的本地端口。 */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** 启动后端子进程：返回 ChildProcess。 */
function startBackend(port) {
  if (IS_PACKAGED) {
    // 打包态：electron-builder 把 PyInstaller 后端放到 resources/backend/
    const exe = path.join(
      process.resourcesPath,
      "backend",
      process.platform === "win32" ? "SubtitlePlayer-backend.exe" : "SubtitlePlayer-backend"
    );
    return spawn(exe, ["--no-open", "--port", String(port)], {
      cwd: path.dirname(exe),
      windowsHide: true,
    });
  }
  // 开发态：用 uv 运行源码后端
  return spawn(
    "uv",
    ["run", "python", "subtitle_player/run.py", "--no-open", "--port", String(port)],
    { cwd: PROJECT_ROOT, shell: process.platform === "win32", windowsHide: true }
  );
}

/** 轮询健康检查，直到后端就绪或超时。 */
function waitForBackend(port, timeoutMs = 40000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(
        { host: "127.0.0.1", port, path: "/api/health", timeout: 1500 },
        (res) => {
          res.resume();
          if (res.statusCode === 200) return resolve();
          retry();
        }
      );
      req.on("error", retry);
      req.on("timeout", () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error("后端启动超时（40s）"));
      }
      setTimeout(probe, 400);
    };
    probe();
  });
}

/** 彻底结束后端子进程（Windows 需连同子孙进程）。 */
function killBackend() {
  if (!backendProc || backendProc.killed) return;
  const pid = backendProc.pid;
  try {
    if (process.platform === "win32" && pid) {
      execFile("taskkill", ["/pid", String(pid), "/T", "/F"]);
    } else {
      backendProc.kill("SIGTERM");
    }
  } catch (_) {
    /* 忽略清理异常 */
  }
  backendProc = null;
}

// 仅支持单栏：所有视图内容区宽度统一 450（双语为上下堆叠的窄屏布局）
const VIEW_WIDTH = { both: 450, en: 450, zh: 450 };
const DEFAULT_VIEW = "both";

async function createWindow() {
  Menu.setApplicationMenu(null); // 去掉默认菜单栏

  win = new BrowserWindow({
    useContentSize: true, // width/height 指网页内容区尺寸，与 CSS 宽度对齐
    width: VIEW_WIDTH[DEFAULT_VIEW], // 固定单栏 450
    height: 860,
    minWidth: VIEW_WIDTH.en, // 单栏 450
    minHeight: 600,
    backgroundColor: "#ECE6D6", // 护眼米黄，规避启动白屏
    show: true,
    autoHideMenuBar: true,
    title: "字幕播放工具",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 外部链接用系统浏览器打开，不在应用内导航
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // 先显示本地加载页
  await win.loadFile(path.join(__dirname, "loading.html"));

  try {
    backendPort = await getFreePort();
    backendProc = startBackend(backendPort);
    backendProc.on("exit", (code) => {
      console.log(`[backend] exited code=${code}`);
    });
    if (backendProc.stdout) backendProc.stdout.on("data", (d) => process.stdout.write(`[backend] ${d}`));
    if (backendProc.stderr) backendProc.stderr.on("data", (d) => process.stderr.write(`[backend] ${d}`));

    await waitForBackend(backendPort);
    await win.loadURL(`http://127.0.0.1:${backendPort}/`);
  } catch (err) {
    dialog.showErrorBox("启动失败", String(err && err.message ? err.message : err));
    app.quit();
  }
}

// 单实例：再次启动则聚焦已有窗口
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on("window-all-closed", () => app.quit());
app.on("before-quit", killBackend);
app.on("quit", killBackend);
process.on("exit", killBackend);

// ---------- IPC：按视图调整窗口内容宽度（双栏 900 / 单栏 450，高度不变，居中保持） ----------
ipcMain.handle("set-view-width", (_e, view) => {
  if (!win || win.isDestroyed()) return;
  if (win.isMaximized() || win.isFullScreen()) return; // 最大化/全屏时不改尺寸
  const target = VIEW_WIDTH[view];
  if (!target) return;
  const [w, h] = win.getContentSize();
  if (w === target) return;
  const [x, y] = win.getPosition();
  win.setContentSize(target, h, false);
  // 以原中心为锚点重新居中，避免左上角固定导致视觉跳动
  win.setPosition(Math.round(x + (w - target) / 2), y, false);
});

// ---------- IPC：原生文件选择对话框 ----------
ipcMain.handle("pick-subtitle", async () => {
  const r = await dialog.showOpenDialog(win, {
    title: "选择字幕文件",
    filters: [
      { name: "字幕文件", extensions: ["txt", "srt", "vtt"] },
      { name: "所有文件", extensions: ["*"] },
    ],
    properties: ["openFile"],
  });
  return r.canceled || !r.filePaths.length ? null : r.filePaths[0];
});
