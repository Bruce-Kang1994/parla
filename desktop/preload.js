const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("murmur", {
  // Audio processing (transcribe + polish in main process)
  processAudio: (data) => ipcRenderer.invoke("process-audio", data),

  // Text actions
  insertText: (text) => ipcRenderer.send("insert-text", text),
  copyText: (text) => ipcRenderer.send("copy-text", text),

  // Recording state
  setRecordingState: (recording) => ipcRenderer.send("recording-state", recording),
  onToggleRecording: (cb) => ipcRenderer.on("toggle-recording", () => cb()),

  // Navigation
  onNavigate: (cb) => ipcRenderer.on("navigate", (_e, page) => cb(page)),
  onInit: (cb) => ipcRenderer.on("init", (_e, data) => cb(data)),

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (s) => ipcRenderer.invoke("save-settings", s),
  validateApiKey: (key) => ipcRenderer.invoke("validate-api-key", key),

  // Permissions
  checkPermissions: () => ipcRenderer.invoke("check-permissions"),
  requestMicPermission: () => ipcRenderer.send("request-mic-permission"),
  openAccessibilitySettings: () => ipcRenderer.send("open-accessibility-settings"),

  // History & Stats
  getHistory: () => ipcRenderer.invoke("get-history"),
  clearHistory: () => ipcRenderer.send("clear-history"),
  getStats: () => ipcRenderer.invoke("get-stats"),

  // Misc
  hide: () => ipcRenderer.send("hide-window"),
  openUrl: (url) => ipcRenderer.send("open-url", url),
});
