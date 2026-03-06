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
} = require("electron");
const path = require("path");
const { execSync } = require("child_process");
const { writeFileSync, unlinkSync } = require("fs");
const { tmpdir } = require("os");

// --- Store (settings persistence) ---
let store;
async function initStore() {
  const Store = (await import("electron-store")).default;
  store = new Store({
    defaults: {
      apiKey: "",
      shortcut: "CommandOrControl+Shift+M",
      context: "general",
      language: "auto",
      outputLanguage: "auto",
      soundEffects: true,
      launchAtLogin: false,
      onboardingDone: false,
      history: [],
      weeklyUsage: { count: 0, resetAt: getNextMonday() },
      stats: { totalDuration: 0, totalChars: 0, totalSessions: 0 },
    },
  });
}

function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(0, 0, 0, 0);
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

const FREE_LIMIT = 10000; // 10,000 chars/week

// --- App State ---
let tray = null;
let mainWin = null;
let isCurrentlyRecording = false;

// --- App Lifecycle ---
app.whenReady().then(async () => {
  await initStore();

  // Show dock icon — Parla is a full desktop app
  // if (process.platform === "darwin") app.dock.hide();

  createTray();
  createMainWindow();
  registerShortcuts();

  console.log("[Parla] Ready. Press", store.get("shortcut"), "to record.");
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", (e) => {
  e.preventDefault();
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
  tray.setToolTip("Parla 语音输入");
  updateTrayMenu();

  tray.on("click", () => {
    showMainWindow();
  });
}

function updateTrayMenu() {
  const usage = getUsage();
  const menu = Menu.buildFromTemplate([
    { label: "Parla 语音输入", enabled: false },
    { type: "separator" },
    {
      label: isCurrentlyRecording ? "⏹ 停止录音" : "🎤 开始录音",
      accelerator: store.get("shortcut"),
      click: () => sendToggle(),
    },
    { type: "separator" },
    {
      label: `本周: ${usage.count.toLocaleString()} / ${FREE_LIMIT.toLocaleString()} 字`,
      enabled: false,
    },
    { type: "separator" },
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
    width: 940,
    height: 640,
    minWidth: 720,
    minHeight: 480,
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

  mainWin.loadFile(path.join(__dirname, "index.html"));

  mainWin.webContents.on("did-finish-load", () => {
    const onboardingDone = store.get("onboardingDone");
    const apiKey = store.get("apiKey");

    mainWin.webContents.send("init", {
      onboardingDone,
      apiKey: apiKey ? "configured" : "",
      shortcut: store.get("shortcut"),
      context: store.get("context"),
      language: store.get("language"),
      outputLanguage: store.get("outputLanguage"),
      soundEffects: store.get("soundEffects"),
      usage: getUsage(),
      freeLimit: FREE_LIMIT,
      history: store.get("history").slice(0, 50),
      stats: store.get("stats"),
    });

    mainWin.show();
  });
}

function showMainWindow() {
  if (!mainWin) return;
  mainWin.show();
  mainWin.focus();
}

function sendToggle() {
  if (!mainWin.isVisible()) {
    showMainWindow();
  }
  mainWin.webContents.send("toggle-recording");
}

// --- Global Shortcuts ---
function registerShortcuts() {
  const shortcut = store.get("shortcut");
  try {
    globalShortcut.unregisterAll();
    const ok = globalShortcut.register(shortcut, () => sendToggle());
    if (!ok) console.error("[Parla] Failed to register shortcut:", shortcut);
  } catch (e) {
    console.error("[Parla] Shortcut error:", e.message);
  }
}

// --- Embedded API: Transcribe ---
function transcribeAudio(audioPath) {
  const apiKey = store.get("apiKey");
  if (!apiKey) throw new Error("NO_API_KEY");

  const result = execSync(
    `curl -s https://api.groq.com/openai/v1/audio/transcriptions ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-F "file=@${audioPath}" ` +
      `-F "model=whisper-large-v3-turbo" ` +
      `-F "response_format=verbose_json"`,
    { timeout: 30000 }
  ).toString();

  const data = JSON.parse(result);
  if (data.error) throw new Error(data.error.message || "Groq API error");
  return { raw: data.text, language: data.language || "auto", duration: data.duration || 0 };
}

// --- Embedded API: Polish ---
function polishText(raw, context = "general") {
  const apiKey = store.get("apiKey");
  if (!apiKey) throw new Error("NO_API_KEY");

  const prompt = buildPolishPrompt(context);
  const payload = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: raw },
    ],
    temperature: 0,
    max_tokens: 2048,
  });

  const result = execSync(
    `curl -s https://api.groq.com/openai/v1/chat/completions ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-d ${shellEscape(payload)}`,
    { timeout: 30000 }
  ).toString();

  const data = JSON.parse(result);
  if (data.error) throw new Error(data.error.message || "LLM error");
  return data.choices[0]?.message?.content?.trim() || raw;
}

function shellEscape(str) {
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

function buildPolishPrompt(context) {
  const ctxMap = {
    email: "Format as a professional email body. Use proper greeting/closing if implied.",
    chat: "Keep it concise and conversational. Use short sentences.",
    document: "Format as well-structured prose with proper paragraphs and punctuation.",
    code: "Format as a code comment or documentation. Be precise and technical.",
    general: "Format as clean, natural text.",
  };

  return `You are a voice-to-text cleanup tool. Your ONLY job is to clean up raw speech transcription. You must preserve ALL original content and meaning.

STRICT RULES:
1. Remove filler words: um, uh, like, you know, 嗯, 啊, 那个, 就是, えーと, 음
2. When the speaker corrects themselves ("no wait", "I mean", "不对", "应该是"), keep ONLY the corrected version
3. Merge repeated/stuttered phrases into one clean version
4. Add proper punctuation
5. If the speaker lists items, format as a list

ABSOLUTE PROHIBITIONS:
- NEVER summarize or shorten the content
- NEVER add information not in the original
- NEVER change the meaning or intent
- NEVER rephrase sentences in your own words
- NEVER translate between languages
- NEVER omit any topic or point the speaker mentioned
- If the speaker said 10 things, the output must contain all 10 things

The output should read like what the speaker INTENDED to write, not a summary of what they said.

Context: ${ctxMap[context] || ctxMap.general}
Tone: Use clear, professional language without being overly formal.

Output ONLY the cleaned text. No explanations, no prefixes like "Here is the polished text:".`;
}

// --- Embedded API: Validate Key ---
function validateApiKey(key) {
  try {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" https://api.groq.com/openai/v1/models ` +
        `-H "Authorization: Bearer ${key}"`,
      { timeout: 10000 }
    ).toString().trim();
    return result === "200";
  } catch {
    return false;
  }
}

// --- IPC Handlers ---

// Process audio blob (receive as base64 from renderer)
ipcMain.handle("process-audio", async (_event, { audioBase64, context }) => {
  // Check usage limit
  const usage = getUsage();
  if (usage.count >= FREE_LIMIT) {
    return { error: "LIMIT_REACHED", usage };
  }

  let tmpPath = "";
  try {
    // Write audio to temp file
    tmpPath = path.join(tmpdir(), `parla_${Date.now()}.webm`);
    writeFileSync(tmpPath, Buffer.from(audioBase64, "base64"));

    // Step 1: Transcribe
    const { raw, language, duration } = transcribeAudio(tmpPath);
    if (!raw || !raw.trim()) return { error: "NO_SPEECH" };

    // Step 2: Polish
    const polished = polishText(raw, context);
    const finalText = polished || raw;

    // Track usage + stats
    addUsage(finalText.length);
    const stats = store.get("stats") || { totalDuration: 0, totalChars: 0, totalSessions: 0 };
    stats.totalDuration += duration;
    stats.totalChars += finalText.length;
    stats.totalSessions += 1;
    store.set("stats", stats);

    // Save to history
    const historyItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      raw,
      polished: finalText,
      context,
      duration,
      language,
    };
    const history = store.get("history");
    history.unshift(historyItem);
    store.set("history", history.slice(0, 100));

    return {
      raw,
      polished: finalText,
      language,
      duration,
      usage: getUsage(),
    };
  } catch (err) {
    console.error("[Parla] Process error:", err.message);
    if (err.message === "NO_API_KEY") return { error: "NO_API_KEY" };
    return { error: err.message };
  } finally {
    if (tmpPath) {
      try { unlinkSync(tmpPath); } catch {}
    }
  }
});

// Insert text at cursor
ipcMain.on("insert-text", (_event, text) => {
  clipboard.writeText(text);

  setTimeout(() => {
    try {
      execSync(
        `osascript -e 'tell application "System Events" to keystroke "v" using command down'`
      );
    } catch (e) {
      console.error("[Parla] Paste failed. Grant Accessibility permission.");
      new Notification({
        title: "Parla",
        body: "无法插入文本，请在「系统设置 → 隐私与安全 → 辅助功能」中授权 Parla",
      }).show();
    }
  }, 200);
});

ipcMain.on("copy-text", (_event, text) => {
  clipboard.writeText(text);
});

ipcMain.on("recording-state", (_event, recording) => {
  isCurrentlyRecording = recording;
  updateTrayMenu();
});

ipcMain.handle("get-stats", () => {
  const stats = store.get("stats") || { totalDuration: 0, totalChars: 0, totalSessions: 0 };
  const durationMin = Math.round(stats.totalDuration / 60 * 10) / 10;
  const avgSpeed = stats.totalDuration > 0 ? Math.round(stats.totalChars / (stats.totalDuration / 60)) : 0;
  const timeSavedMin = Math.round(stats.totalChars / 40 - stats.totalDuration / 60);
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
  mainWin.hide();
});

// Settings
ipcMain.handle("get-settings", () => ({
  apiKey: store.get("apiKey") ? "configured" : "",
  shortcut: store.get("shortcut"),
  context: store.get("context"),
  language: store.get("language"),
  outputLanguage: store.get("outputLanguage"),
  soundEffects: store.get("soundEffects"),
  launchAtLogin: store.get("launchAtLogin"),
  onboardingDone: store.get("onboardingDone"),
  usage: getUsage(),
  freeLimit: FREE_LIMIT,
  history: store.get("history").slice(0, 50),
}));

ipcMain.handle("save-settings", (_event, settings) => {
  if (settings.apiKey !== undefined && settings.apiKey !== "configured") {
    store.set("apiKey", settings.apiKey);
  }
  if (settings.shortcut) {
    store.set("shortcut", settings.shortcut);
    registerShortcuts();
  }
  if (settings.context) store.set("context", settings.context);
  if (settings.language) store.set("language", settings.language);
  if (settings.outputLanguage) store.set("outputLanguage", settings.outputLanguage);
  if (settings.soundEffects !== undefined) store.set("soundEffects", settings.soundEffects);
  if (settings.launchAtLogin !== undefined) {
    store.set("launchAtLogin", settings.launchAtLogin);
    app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
  }
  if (settings.onboardingDone !== undefined) store.set("onboardingDone", settings.onboardingDone);
  return true;
});

ipcMain.handle("validate-api-key", (_event, key) => {
  return validateApiKey(key);
});

ipcMain.handle("check-permissions", () => {
  const mic = systemPreferences.getMediaAccessStatus("microphone");
  // Accessibility check via AppleScript
  let accessibility = false;
  try {
    execSync(
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

ipcMain.on("open-url", (_event, url) => {
  shell.openExternal(url);
});

ipcMain.handle("get-history", () => {
  return store.get("history").slice(0, 100);
});

ipcMain.on("clear-history", () => {
  store.set("history", []);
});
