const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("murmur", {
  // Audio processing
  processAudio: (data) => ipcRenderer.invoke("process-audio", data),

  // Text actions
  insertText: (text) => ipcRenderer.send("insert-text", text),
  copyText: (text) => ipcRenderer.send("copy-text", text),

  // Recording state
  setRecordingState: (recording) =>
    ipcRenderer.send("recording-state", recording),
  onToggleRecording: (cb) => {
    ipcRenderer.removeAllListeners("toggle-recording");
    ipcRenderer.on("toggle-recording", () => cb());
  },
  toggleRecording: () => ipcRenderer.send("toggle-recording-from-renderer"),

  // Navigation
  onNavigate: (cb) => {
    ipcRenderer.removeAllListeners("navigate");
    ipcRenderer.on("navigate", (_e, page) => cb(page));
  },
  onInit: (cb) => {
    ipcRenderer.removeAllListeners("init");
    ipcRenderer.on("init", (_e, data) => cb(data));
  },

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (s) => ipcRenderer.invoke("save-settings", s),

  // Permissions
  checkPermissions: () => ipcRenderer.invoke("check-permissions"),
  requestMicPermission: () => ipcRenderer.send("request-mic-permission"),
  openAccessibilitySettings: () =>
    ipcRenderer.send("open-accessibility-settings"),
  openInputMonitoringSettings: () =>
    ipcRenderer.send("open-input-monitoring-settings"),

  // History & Stats
  getHistory: () => ipcRenderer.invoke("get-history"),
  clearHistory: () => ipcRenderer.send("clear-history"),
  getStats: () => ipcRenderer.invoke("get-stats"),

  // Audio devices
  getAudioDevices: () => ipcRenderer.invoke("get-audio-devices"),

  // Theme
  onThemeChanged: (cb) => {
    ipcRenderer.removeAllListeners("theme-changed");
    ipcRenderer.on("theme-changed", (_e, theme) => cb(theme));
  },

  // Shortcut conflict
  onShortcutConflict: (cb) => {
    ipcRenderer.removeAllListeners("shortcut-conflict");
    ipcRenderer.on("shortcut-conflict", (_e, shortcut) => cb(shortcut));
  },

  // Float window
  onFloatUpdate: (cb) => {
    ipcRenderer.removeAllListeners("float-update");
    ipcRenderer.on("float-update", (_e, state) => cb(state));
  },

  // Auth & Backend
  authLogin: (email) => ipcRenderer.invoke("auth-login", email),
  authVerify: (data) => ipcRenderer.invoke("auth-verify", data),
  getAuthState: () => ipcRenderer.invoke("get-auth-state"),
  authLogout: () => ipcRenderer.invoke("auth-logout"),
  syncProfile: () => ipcRenderer.invoke("sync-profile"),
  createInviteCode: () => ipcRenderer.invoke("create-invite-code"),
  redeemInviteCode: (code) => ipcRenderer.invoke("redeem-invite-code", code),
  redeemProCode: (code) => ipcRenderer.invoke("redeem-pro-code", code),

  // Misc
  hide: () => ipcRenderer.send("hide-window"),
  openUrl: (url) => ipcRenderer.send("open-url", url),
});
