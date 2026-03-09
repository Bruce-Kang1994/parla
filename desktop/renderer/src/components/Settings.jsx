import { useState, useEffect, useCallback } from 'react';

// Bug 1: macOS 上显示 ⌘⇧ 符号
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

const SHORTCUT_OPTIONS = [
  { value: 'CommandOrControl+Shift+M', label: isMac ? '⌘⇧M' : 'Ctrl+Shift+M' },
  { value: 'CommandOrControl+Shift+Space', label: isMac ? '⌘⇧Space' : 'Ctrl+Shift+Space' },
  { value: 'CommandOrControl+Shift+;', label: isMac ? '⌘⇧;' : 'Ctrl+Shift+;' },
  { value: 'Alt+Space', label: isMac ? '⌥Space' : 'Alt+Space' },
  { value: 'F5', label: 'F5' },
];

const CONTEXT_OPTIONS = [
  { value: 'general', label: '通用' },
  { value: 'email', label: '邮件' },
  { value: 'chat', label: '聊天' },
  { value: 'document', label: '文档' },
  { value: 'code', label: '代码' },
];

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: '自动检测' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
];

export default function Settings({ settings, onChange }) {
  const [devices, setDevices] = useState([]);
  const [perms, setPerms] = useState({ microphone: false, accessibility: false });
  // Bug 6: 快捷键冲突提示
  const [shortcutConflict, setShortcutConflict] = useState('');

  useEffect(() => {
    window.murmur.getAudioDevices().then(setDevices);
    window.murmur.checkPermissions().then(setPerms);

    // Bug 6: 监听快捷键冲突
    window.murmur.onShortcutConflict((shortcut) => {
      setShortcutConflict(shortcut);
      setTimeout(() => setShortcutConflict(''), 5000);
    });
  }, []);

  const refreshPerms = useCallback(async () => {
    setPerms(await window.murmur.checkPermissions());
  }, []);

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>设置</h2>

      {/* Shortcuts & Input */}
      <div className="card">
        <div className="card-title">快捷键与输入</div>
        {/* Bug 6: 快捷键冲突警告 */}
        {shortcutConflict && (
          <div style={{
            background: 'var(--warning-light)',
            border: '1px solid var(--warning)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--warning)',
            marginBottom: 12,
          }}>
            快捷键 {shortcutConflict} 已被其他应用占用，请选择其他快捷键
          </div>
        )}
        <div className="setting-row">
          <div>
            <div className="setting-label">快捷键</div>
            <div className="setting-desc">全局触发录音</div>
          </div>
          <div className="setting-control">
            <select
              className="select"
              style={{ width: 200 }}
              value={settings.shortcut}
              onChange={(e) => { onChange({ shortcut: e.target.value }); setShortcutConflict(''); }}
            >
              {SHORTCUT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">默认场景</div>
            <div className="setting-desc">影响文本润色风格</div>
          </div>
          <div className="setting-control">
            <select
              className="select"
              style={{ width: 200 }}
              value={settings.context}
              onChange={(e) => onChange({ context: e.target.value })}
            >
              {CONTEXT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">语音语言</div>
            <div className="setting-desc">选择语音识别语言</div>
          </div>
          <div className="setting-control">
            <select
              className="select"
              style={{ width: 200 }}
              value={settings.language || 'auto'}
              onChange={(e) => onChange({ language: e.target.value })}
            >
              {LANGUAGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">音效</div>
            <div className="setting-desc">录音开始/结束时播放提示音</div>
          </div>
          <div className="setting-control">
            <button
              className={`toggle ${settings.soundEffects ? 'on' : ''}`}
              onClick={() => onChange({ soundEffects: !settings.soundEffects })}
            />
          </div>
        </div>
      </div>

      {/* Audio */}
      <div className="card">
        <div className="card-title">音频</div>
        <div className="setting-row">
          <div>
            <div className="setting-label">麦克风</div>
          </div>
          <div className="setting-control">
            <select
              className="select"
              style={{ width: 240 }}
              value={settings.audioDevice}
              onChange={(e) => onChange({ audioDevice: e.target.value })}
            >
              <option value="default">默认麦克风</option>
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>权限状态</span>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={refreshPerms}>刷新</button>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">麦克风</div>
            <div className="setting-desc">仅在你主动按下快捷键时录音，不后台监听</div>
          </div>
          <div className="setting-control">
            {perms.microphone ? (
              <span className="badge badge-success">已授权</span>
            ) : (
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => window.murmur.requestMicPermission()}>
                授权
              </button>
            )}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">辅助功能</div>
            <div className="setting-desc">将识别结果粘贴到你正在输入的位置（不读取屏幕内容）</div>
          </div>
          <div className="setting-control">
            {perms.accessibility ? (
              <span className="badge badge-success">已授权</span>
            ) : (
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => window.murmur.openAccessibilitySettings()}>
                去设置
              </button>
            )}
          </div>
        </div>
      </div>

      {/* General */}
      <div className="card">
        <div className="card-title">通用</div>
        <div className="setting-row">
          <div>
            <div className="setting-label">在 Dock 中显示</div>
          </div>
          <div className="setting-control">
            <button
              className={`toggle ${settings.showInDock ? 'on' : ''}`}
              onClick={() => onChange({ showInDock: !settings.showInDock })}
            />
          </div>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">开机自启</div>
          </div>
          <div className="setting-control">
            <button
              className={`toggle ${settings.launchAtLogin ? 'on' : ''}`}
              onClick={() => onChange({ launchAtLogin: !settings.launchAtLogin })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
