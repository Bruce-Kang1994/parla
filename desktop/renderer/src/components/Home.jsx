import { useState, useEffect, useRef, useCallback } from 'react';

const SCENES = [
  { id: 'general', label: '通用', icon: '&#9997;' },
  { id: 'email', label: '邮件', icon: '&#9993;' },
  { id: 'chat', label: '聊天', icon: '&#128172;' },
  { id: 'document', label: '文档', icon: '&#128196;' },
  { id: 'code', label: '代码', icon: '&#128187;' },
];

const BAR_COUNT = 7;

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// Bug 1: macOS 上显示 ⌘⇧ 而非 Ctrl+Shift
function formatShortcut(shortcut) {
  if (!shortcut) return '';
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  return shortcut
    .replace(/CommandOrControl/g, isMac ? '⌘' : 'Ctrl')
    .replace(/Shift/g, isMac ? '⇧' : 'Shift')
    .replace(/Alt/g, isMac ? '⌥' : 'Alt')
    .replace(/\+/g, isMac ? '' : '+');
}

export default function Home({ isRecording, onToggle, stats, history, settings, onContextChange, usage, freeLimit, lastError }) {
  const recentHistory = (history || []).slice(0, 5);
  const currentContext = settings?.context || 'general';
  const limitReached = (usage?.count || 0) >= (freeLimit || 10000);

  // P0-1: 实时音量柱
  const [volumes, setVolumes] = useState(() => new Array(BAR_COUNT).fill(4));
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animIdRef = useRef(null);
  const streamRef = useRef(null);

  const startVolumeVis = useCallback(async () => {
    try {
      const deviceId = settings?.audioDevice;
      const constraints = {
        audio: deviceId && deviceId !== 'default'
          ? { deviceId: { exact: deviceId } }
          : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const step = Math.floor(data.length / BAR_COUNT);
        const bars = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          const val = data[i * step] || 0;
          bars.push(Math.max(4, Math.round((val / 255) * 32)));
        }
        setVolumes(bars);
        animIdRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  }, [settings?.audioDevice]);

  const stopVolumeVis = useCallback(() => {
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setVolumes(new Array(BAR_COUNT).fill(4));
  }, []);

  useEffect(() => {
    if (isRecording) startVolumeVis();
    else stopVolumeVis();
    return () => stopVolumeVis();
  }, [isRecording, startVolumeVis, stopVolumeVis]);

  return (
    <div className="fade-in">
      {/* 额度用完提示 + 升级 CTA */}
      {limitReached && (
        <div className="card" style={{ marginBottom: 16, background: 'var(--warning-light)', border: '1px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 20 }}>&#9888;</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--warning)' }}>
                本周免费额度已用完。
                <button
                  style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 6, textDecoration: 'underline' }}
                  onClick={() => window.murmur.openUrl('https://parla.app/pricing')}
                >
                  升级 Pro &rarr;
                </button>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>已使用 {(usage?.count || 0).toLocaleString()} / {(freeLimit || 10000).toLocaleString()} 字</div>
            </div>
            <button
              className="btn"
              style={{ padding: '4px 12px', fontSize: 12, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => window.murmur.openUrl('https://parla.app/pricing')}
            >
              升级 Pro
            </button>
          </div>
        </div>
      )}

      {/* Bug 5: 错误提示 */}
      {lastError && (
        <div className="card" style={{ marginBottom: 16, background: 'var(--danger-light)', border: '1px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 20 }}>&#10060;</span>
            <div style={{ color: 'var(--danger)', fontWeight: 500 }}>{lastError}</div>
          </div>
        </div>
      )}

      {/* Record section */}
      <div className="card">
        <div className="record-section">
          <button
            className={`record-btn ${isRecording ? 'recording' : ''} ${limitReached ? 'disabled' : ''}`}
            onClick={limitReached ? undefined : onToggle}
            disabled={limitReached}
            style={limitReached ? { opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' } : undefined}
          >
            {isRecording ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 36, marginTop: 8 }}>
              {volumes.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: h,
                    background: 'var(--primary)',
                    borderRadius: 2,
                    transition: 'height 0.08s ease-out',
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          )}
          <div className="record-hint">
            {limitReached
              ? '本周额度已用完'
              : isRecording
                ? '录音中...再次按下快捷键或点击按钮停止'
                : <>按下 <kbd>{formatShortcut(settings?.shortcut)}</kbd> 或点击按钮开始录音</>
            }
          </div>
        </div>

        {/* Scene selector */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="scene-pills">
            {SCENES.map(s => (
              <button
                key={s.id}
                className={`scene-pill ${currentContext === s.id ? 'active' : ''}`}
                onClick={() => onContextChange(s.id)}
                dangerouslySetInnerHTML={{ __html: `${s.icon}&nbsp;${s.label}` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.totalSessions > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">使用统计</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalChars?.toLocaleString() || 0}</div>
              <div className="stat-label">总字数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalSessions || 0}</div>
              <div className="stat-label">录音次数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.timeSavedMin || 0}</div>
              <div className="stat-label">节省时间(分钟)</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">最近活动</div>
        {recentHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">&#128221;</div>
            <div className="empty-state-text">还没有录音记录</div>
          </div>
        ) : (
          recentHistory.map(item => (
            <div
              key={item.id}
              className="activity-item"
              onClick={() => window.murmur.copyText(item.polished)}
              title="点击复制"
            >
              <div className="activity-time">{formatTime(item.timestamp)}</div>
              <div className="activity-text">{item.polished}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
