const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  ipcMain,
  nativeImage,
  clipboard,
  systemPreferences,
  shell,
  Notification,
  screen,
} = require("electron");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

// Allow audio playback without user gesture (for beep sounds)
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

// --- Store (settings persistence) ---
let store;
async function initStore() {
  const Store = (await import("electron-store")).default;
  store = new Store({
    defaults: {
      shortcut: "CommandOrControl+Shift+M",
      context: "general",
      language: "auto",
      outputLanguage: "auto",
      audioDevice: "default",
      soundEffects: true,
      theme: "system",
      showInDock: true,
      launchAtLogin: false,
      onboardingDone: false,
      history: [],
      weeklyUsage: { count: 0, resetAt: getNextMonday() },
      stats: { totalDuration: 0, totalChars: 0, totalSessions: 0 },
      // Auth & Backend
      apiBase: "",
      authToken: "",
      authRefreshToken: "",
      authEmail: "",
      userPlan: "free",
    },
  });
}

function getNextMonday() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff
  ));
  return next.toISOString();
}

function checkWeeklyReset() {
  const usage = store.get("weeklyUsage");
  if (new Date() >= new Date(usage.resetAt)) {
    store.set("weeklyUsage", { count: 0, resetAt: getNextMonday() });
  }
}

function addUsage(charCount) {
  checkWeeklyReset();
  const usage = store.get("weeklyUsage");
  usage.count += charCount;
  store.set("weeklyUsage", usage);
}

function getUsage() {
  checkWeeklyReset();
  return store.get("weeklyUsage");
}

const FREE_LIMIT = 6000;

// --- Backend API (uses native fetch, no shell injection risk) ---
function getApiBase() {
  // Priority: env var > store > default
  return (
    process.env.PARLA_API_BASE ||
    (store && store.get("apiBase")) ||
    "https://parla.vercel.app/api"
  );
}

async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const token = store.get("authToken");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(options.timeout || 10000),
  });
  return res.json();
}

// Sync usage to backend (fire-and-forget)
async function syncUsageToBackend(chars) {
  if (!store.get("authToken")) return;
  try {
    await apiFetch("/user/usage", {
      method: "POST",
      body: JSON.stringify({ chars }),
    });
  } catch {
    // 离线也不影响本地功能
  }
}

// Fetch profile from backend
async function fetchProfile() {
  if (!store.get("authToken")) return null;
  try {
    const data = await apiFetch("/user/profile");
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}

// --- App State ---
let tray = null;
let mainWin = null;
let floatWin = null;
let isRecording = false;
let isQuitting = false;

// --- App Lifecycle ---
app.whenReady().then(async () => {
  await initStore();
  createTray();
  createMainWindow();
  createFloatWindow();
  console.log("[Parla] App ready.");
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // Don't quit — keep running in tray
});

// --- Tray ---
function createTray() {
  let icon;
  const iconPath = path.join(__dirname, "iconTemplate.png");
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error("empty");
    icon.setTemplateImage(true);
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Parla");

  tray.on("click", () => {
    handleToggle();
  });

  tray.on("right-click", () => {
    updateTrayMenu();
    tray.popUpContextMenu();
  });
}

function updateTrayMenu() {
  const usage = getUsage();
  const menu = Menu.buildFromTemplate([
    { label: "Parla", enabled: false },
    { type: "separator" },
    {
      label: isRecording ? "停止录音" : "开始录音",
      accelerator: store.get("shortcut"),
      click: () => handleToggle(),
    },
    { type: "separator" },
    {
      label: `本周: ${usage.count.toLocaleString()} / ${FREE_LIMIT.toLocaleString()} 字`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "打开 Parla",
      click: () => showMainWindow(),
    },
    {
      label: "设置",
      click: () => {
        showMainWindow();
        mainWin.webContents.send("navigate", "settings");
      },
    },
    { type: "separator" },
    { label: "退出 Parla", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
}

// --- Main Window ---
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 800,
    minHeight: 560,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: "#FFFFFF",
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Dev: load from Vite dev server; Prod: load built files
  const devURL = process.env.VITE_DEV_SERVER_URL;
  if (devURL) {
    mainWin.loadURL(devURL);
    mainWin.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWin.loadFile(path.join(__dirname, "renderer", "dist", "index.html"));
  }

  mainWin.webContents.on("did-finish-load", () => {
    mainWin.webContents.send("init", {
      onboardingDone: store.get("onboardingDone"),
      shortcut: store.get("shortcut"),
      context: store.get("context"),
      language: store.get("language"),
      outputLanguage: store.get("outputLanguage"),
      audioDevice: store.get("audioDevice"),
      soundEffects: store.get("soundEffects"),
      theme: store.get("theme"),
      showInDock: store.get("showInDock"),
      usage: getUsage(),
      freeLimit: FREE_LIMIT,
      history: store.get("history").slice(0, 50),
      stats: store.get("stats"),
    });

    registerShortcuts();
    mainWin.show();
  });

  mainWin.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWin.hide();
    }
  });
}

function showMainWindow() {
  if (!mainWin) return;
  mainWin.show();
  mainWin.focus();
}

// --- Float Window ---
function createFloatWindow() {
  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize;

  floatWin = new BrowserWindow({
    width: 380,
    height: 88,
    x: Math.round((screenW - 380) / 2),
    y: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  floatWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  floatWin.loadFile(path.join(__dirname, "float.html"));
}

function showFloat(state) {
  if (!floatWin) return;
  // Attach sound preference to state
  state.soundEnabled = store.get("soundEffects") !== false;
  floatWin.webContents.send("float-update", state);
  if (!floatWin.isVisible()) {
    floatWin.showInactive();
  }
}

function hideFloat() {
  if (!floatWin) return;
  floatWin.webContents.send("float-update", { status: "hide" });
  setTimeout(() => {
    if (floatWin && floatWin.isVisible()) floatWin.hide();
  }, 300);
}

// --- Recording Toggle ---
function handleToggle() {
  if (!isRecording) {
    // Start recording
    isRecording = true;
    if (tray) tray.setTitle("●");
    showFloat({ status: "listening", context: store.get("context") || "general" });
    if (mainWin) mainWin.webContents.send("toggle-recording");
  } else {
    // Stop recording
    isRecording = false;
    if (tray) tray.setTitle("");
    showFloat({ status: "processing" });
    if (mainWin) mainWin.webContents.send("toggle-recording");
  }
}

// --- Global Shortcuts ---
function registerShortcuts() {
  const shortcut = store.get("shortcut");
  globalShortcut.unregisterAll();
  if (!shortcut) return;

  // Modifier-only shortcuts use renderer-side detection
  if (shortcut.startsWith("__modifier__:")) {
    const modKey = shortcut.split(":")[1];
    startModifierKeyListener(modKey);
    return;
  }

  try {
    const ok = globalShortcut.register(shortcut, () => {
      console.log("[Parla] Shortcut triggered:", shortcut);
      handleToggle();
    });
    if (!ok) {
      console.error("[Parla] Failed to register shortcut:", shortcut);
      if (mainWin) {
        mainWin.webContents.send("shortcut-conflict", shortcut);
      }
    }
  } catch (e) {
    console.error("[Parla] Shortcut error:", e.message);
  }
}

function startModifierKeyListener(modKey) {
  if (!mainWin) return;
  const keyName = modKey === "CommandOrControl" ? "Meta" : modKey;
  mainWin.webContents.executeJavaScript(`
    (function() {
      if (window.__modShortcutCleanup) window.__modShortcutCleanup();
      let held = false, otherPressed = false;
      function onDown(e) {
        if (e.key === "${keyName}") { held = true; otherPressed = false; }
        else if (held) { otherPressed = true; }
      }
      function onUp(e) {
        if (e.key === "${keyName}" && held && !otherPressed) {
          window.murmur.toggleRecording && window.murmur.toggleRecording();
        }
        if (e.key === "${keyName}") held = false;
      }
      document.addEventListener("keydown", onDown, true);
      document.addEventListener("keyup", onUp, true);
      window.__modShortcutCleanup = () => {
        document.removeEventListener("keydown", onDown, true);
        document.removeEventListener("keyup", onUp, true);
      };
    })();
  `).catch(() => {});
}

// --- Backend API: Process Audio (Groq ASR + Polish) ---
async function processAudioViaBackend(audioBase64, context, language) {
  const base = getApiBase();
  const authToken = store.get("authToken");
  const res = await fetch(`${base}/process-audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, context, language, authToken }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await res.json();
  data._httpStatus = res.status;
  return data;
}

// --- Async text insertion (Bug 7: 保存并恢复剪贴板) ---
async function pasteText(textToInsert) {
  // 保存用户原有剪贴板内容
  const prevText = clipboard.readText();
  const prevHtml = clipboard.readHTML();
  const prevImage = clipboard.readImage();

  try {
    clipboard.writeText(textToInsert);
    await execAsync(
      `osascript -e 'tell application "System Events" to keystroke "v" using command down'`,
      { timeout: 5000 }
    );

    // 延迟恢复剪贴板（等粘贴完成）
    setTimeout(() => {
      if (!prevImage.isEmpty()) {
        clipboard.writeImage(prevImage);
      } else if (prevHtml && prevHtml !== '<meta charset=\'utf-8\'>') {
        clipboard.write({ text: prevText, html: prevHtml });
      } else {
        clipboard.writeText(prevText);
      }
    }, 500);
  } catch (e) {
    console.error("[Parla] Paste failed:", e.message);
    // 即使粘贴失败也恢复剪贴板
    clipboard.writeText(prevText);
    new Notification({
      title: "Parla",
      body: "无法插入文本，请在系统设置中授予辅助功能权限",
    }).show();
  }
}

// --- IPC Handlers ---

// Process audio (receive as base64 from renderer, forward to backend)
ipcMain.handle("process-audio", async (_event, { audioBase64, context }) => {
  const usage = getUsage();
  if (usage.count >= FREE_LIMIT) {
    showFloat({ status: "error", text: "本周额度已用完，请升级 Pro 继续使用" });
    setTimeout(() => hideFloat(), 3000);
    return { error: "LIMIT_REACHED", usage };
  }

  try {
    const language = store.get("language") || "auto";
    const result = await processAudioViaBackend(audioBase64, context, language);

    if (result.error) {
      let errText = result.error;
      if (result.error === "NO_SPEECH") {
        errText = "未检测到声音，请靠近麦克风或提高音量后重试";
      } else if (result.error === "LIMIT_REACHED") {
        errText = "本周额度已用完，请升级 Pro 继续使用";
      } else if (result.error === "登录已过期" || result._httpStatus === 401) {
        errText = "登录已过期，请重新登录";
        showMainWindow();
        if (mainWin) mainWin.webContents.send("navigate", "settings");
      } else if (result.error === "请先登录") {
        errText = "请先登录后使用";
        showMainWindow();
        if (mainWin) mainWin.webContents.send("navigate", "settings");
      }
      showFloat({ status: "error", text: errText });
      setTimeout(() => hideFloat(), 3000);
      return result;
    }

    const finalText = result.polished || result.transcript;

    // Auto-insert at cursor
    await pasteText(finalText);

    // Update float
    showFloat({ status: "done", text: finalText });
    setTimeout(() => hideFloat(), 1500);

    // Track usage + stats locally
    addUsage(finalText.length);
    syncUsageToBackend(finalText.length);
    const stats = store.get("stats") || {
      totalDuration: 0,
      totalChars: 0,
      totalSessions: 0,
    };
    stats.totalDuration += result.duration || 0;
    stats.totalChars += finalText.length;
    stats.totalSessions += 1;
    store.set("stats", stats);

    // Save to history
    const historyItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      raw: result.transcript,
      polished: finalText,
      context,
      duration: result.duration || 0,
      language: result.language || "auto",
    };
    const history = store.get("history");
    history.unshift(historyItem);
    store.set("history", history.slice(0, 100));

    return {
      raw: result.transcript,
      polished: finalText,
      language: result.language,
      duration: result.duration,
      usage: getUsage(),
    };
  } catch (err) {
    console.error("[Parla] Process error:", err.message);
    const isNetworkError =
      err.name === "AbortError" ||
      err.name === "TypeError" ||
      err.message?.includes("fetch");
    const errText = isNetworkError
      ? "网络连接失败，请检查网络后重试"
      : err.message;
    showFloat({ status: "error", text: errText });
    setTimeout(() => hideFloat(), 3000);
    return { error: errText };
  }
});

// Insert text at cursor
ipcMain.on("insert-text", async (_event, text) => {
  await pasteText(text);
});

ipcMain.on("copy-text", (_event, text) => {
  clipboard.writeText(text);
});

ipcMain.on("recording-state", (_event, recording) => {
  isRecording = recording;
  if (tray) tray.setTitle(recording ? "●" : "");
  updateTrayMenu();
});

ipcMain.on("toggle-recording-from-renderer", () => {
  handleToggle();
});

ipcMain.handle("get-stats", () => {
  const stats = store.get("stats") || {
    totalDuration: 0,
    totalChars: 0,
    totalSessions: 0,
  };
  const durationMin =
    Math.round((stats.totalDuration / 60) * 10) / 10;
  const avgSpeed =
    stats.totalDuration > 0
      ? Math.round(stats.totalChars / (stats.totalDuration / 60))
      : 0;
  const timeSavedMin = Math.round(
    stats.totalChars / 40 - stats.totalDuration / 60
  );
  return {
    totalDuration: stats.totalDuration,
    totalDurationMin: durationMin,
    totalChars: stats.totalChars,
    totalSessions: stats.totalSessions,
    avgSpeed,
    timeSavedMin: Math.max(0, timeSavedMin),
  };
});

ipcMain.on("hide-window", () => {
  if (mainWin) mainWin.hide();
});

// Settings
ipcMain.handle("get-settings", () => ({
  shortcut: store.get("shortcut"),
  context: store.get("context"),
  language: store.get("language"),
  outputLanguage: store.get("outputLanguage"),
  audioDevice: store.get("audioDevice"),
  soundEffects: store.get("soundEffects"),
  theme: store.get("theme"),
  showInDock: store.get("showInDock"),
  launchAtLogin: store.get("launchAtLogin"),
  onboardingDone: store.get("onboardingDone"),
  usage: getUsage(),
  freeLimit: FREE_LIMIT,
  history: store.get("history").slice(0, 50),
}));

ipcMain.handle("save-settings", (_event, settings) => {
  if (settings.shortcut !== undefined) {
    store.set("shortcut", settings.shortcut);
    registerShortcuts();
  }
  if (settings.context !== undefined) store.set("context", settings.context);
  if (settings.language !== undefined) store.set("language", settings.language);
  if (settings.outputLanguage !== undefined)
    store.set("outputLanguage", settings.outputLanguage);
  if (settings.audioDevice !== undefined)
    store.set("audioDevice", settings.audioDevice);
  if (settings.soundEffects !== undefined)
    store.set("soundEffects", settings.soundEffects);
  if (settings.theme !== undefined) {
    store.set("theme", settings.theme);
    if (mainWin) mainWin.webContents.send("theme-changed", settings.theme);
  }
  if (settings.showInDock !== undefined) {
    store.set("showInDock", settings.showInDock);
    if (process.platform === "darwin") {
      if (settings.showInDock) app.dock.show();
      else app.dock.hide();
    }
  }
  if (settings.launchAtLogin !== undefined) {
    store.set("launchAtLogin", settings.launchAtLogin);
    app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
  }
  if (settings.onboardingDone !== undefined)
    store.set("onboardingDone", settings.onboardingDone);
  return true;
});

// Audio devices
ipcMain.handle("get-audio-devices", async () => {
  try {
    const devices = await mainWin.webContents.executeJavaScript(`
      navigator.mediaDevices.enumerateDevices().then(ds =>
        ds.filter(d => d.kind === "audioinput").map(d => ({
          deviceId: d.deviceId,
          label: d.label || ("麦克风 " + d.deviceId.slice(0, 6))
        }))
      )
    `);
    return devices;
  } catch {
    return [];
  }
});

// Permissions
ipcMain.handle("check-permissions", async () => {
  const mic = systemPreferences.getMediaAccessStatus("microphone");
  let accessibility = false;
  try {
    await execAsync(
      `osascript -e 'tell application "System Events" to return name of first process'`,
      { timeout: 3000 }
    );
    accessibility = true;
  } catch {
    accessibility = false;
  }
  return { microphone: mic === "granted", accessibility };
});

ipcMain.on("request-mic-permission", () => {
  systemPreferences.askForMediaAccess("microphone");
});

ipcMain.on("open-accessibility-settings", () => {
  shell.openExternal(
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
  );
});

ipcMain.on("open-input-monitoring-settings", () => {
  shell.openExternal(
    "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent"
  );
});

ipcMain.on("open-url", (_event, url) => {
  shell.openExternal(url);
});

ipcMain.handle("get-history", () => {
  return store.get("history").slice(0, 100);
});

ipcMain.on("clear-history", () => {
  store.set("history", []);
});

// --- Auth & Backend IPC (all use native fetch — no shell injection) ---

// Login: send OTP to email
ipcMain.handle("auth-login", async (_event, email) => {
  try {
    return await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
      timeout: 15000,
    });
  } catch (e) {
    return { error: e.message };
  }
});

// Verify OTP
ipcMain.handle("auth-verify", async (_event, { email, token }) => {
  try {
    const data = await apiFetch("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ email, token }),
      timeout: 15000,
    });
    if (data.session) {
      store.set("authToken", data.session.access_token);
      store.set("authRefreshToken", data.session.refresh_token);
      store.set("authEmail", data.user.email);
    }
    return data;
  } catch (e) {
    return { error: e.message };
  }
});

// Get auth state
ipcMain.handle("get-auth-state", () => {
  return {
    isLoggedIn: !!store.get("authToken"),
    email: store.get("authEmail"),
    plan: store.get("userPlan"),
  };
});

// Logout
ipcMain.handle("auth-logout", () => {
  store.set("authToken", "");
  store.set("authRefreshToken", "");
  store.set("authEmail", "");
  store.set("userPlan", "free");
  return true;
});

// Fetch & sync profile from backend
ipcMain.handle("sync-profile", async () => {
  const profile = await fetchProfile();
  if (profile) {
    store.set("userPlan", profile.plan);
    if (profile.usage) {
      const localUsage = getUsage();
      if (profile.usage.count > localUsage.count) {
        store.set("weeklyUsage", {
          count: profile.usage.count,
          resetAt: store.get("weeklyUsage").resetAt,
        });
      }
    }
    return profile;
  }
  return null;
});

// Generate invite code
ipcMain.handle("create-invite-code", async () => {
  if (!store.get("authToken")) return { error: "未登录" };
  try {
    return await apiFetch("/invite/create", { method: "POST" });
  } catch (e) {
    return { error: e.message };
  }
});

// Redeem invite code
ipcMain.handle("redeem-invite-code", async (_event, code) => {
  if (!store.get("authToken")) return { error: "未登录" };
  try {
    return await apiFetch("/invite/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  } catch (e) {
    return { error: e.message };
  }
});

// Redeem pro code
ipcMain.handle("redeem-pro-code", async (_event, code) => {
  if (!store.get("authToken")) return { error: "未登录" };
  try {
    return await apiFetch("/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  } catch (e) {
    return { error: e.message };
  }
});
