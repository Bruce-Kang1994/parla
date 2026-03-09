import { useState, useEffect, useCallback, useRef } from 'react';
import Titlebar from './components/Titlebar';
import Sidebar from './components/Sidebar';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Settings from './components/Settings';
import History from './components/History';

export default function App() {
  const [page, setPage] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState({ count: 0 });
  const [freeLimit, setFreeLimit] = useState(10000);
  const [lastError, setLastError] = useState('');

  // Refs to avoid stale closures in IPC listeners
  const settingsRef = useRef(null);
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Core recording functions using refs (no stale closures)
  const doStartRecording = useCallback(async () => {
    try {
      const deviceId = settingsRef.current?.audioDevice;
      const constraints = {
        audio: deviceId && deviceId !== 'default'
          ? { deviceId: { exact: deviceId } }
          : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // 清除录音计时器
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const buffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const context = settingsRef.current?.context || 'general';
        const result = await window.murmur.processAudio({ audioBase64: base64, context });

        if (result && !result.error) {
          setLastError('');
          const newHistory = await window.murmur.getHistory();
          setHistory(newHistory);
          const newStats = await window.murmur.getStats();
          setStats(newStats);
          const newSettings = await window.murmur.getSettings();
          setUsage(newSettings.usage);
        } else if (result?.error) {
          let errMsg = result.error;
          if (result.error === 'LIMIT_REACHED') {
            errMsg = '本周额度已用完，请升级 Pro 继续使用';
          } else if (result.error === 'NO_SPEECH') {
            errMsg = '未检测到声音，请靠近麦克风或提高音量后重试';
          } else if (result.error.includes('网络连接失败') || result.error.includes('fetch')) {
            errMsg = '网络连接失败，请检查网络后重试';
          } else if (result.error.includes('登录已过期') || result.error.includes('请先登录')) {
            errMsg = '登录已过期，请重新登录';
          }
          setLastError(errMsg);
          setTimeout(() => setLastError(''), 8000);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      window.murmur.setRecordingState(true);

      // Bug 8: 最长录音 5 分钟自动停止（走正常 toggle 流程同步主进程状态）
      recordingTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          window.murmur.toggleRecording();
        }
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error('Recording failed:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      window.murmur.setRecordingState(false);
    }
  }, []);

  const doStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    window.murmur.setRecordingState(false);
  }, []);

  // Init from main process
  useEffect(() => {
    window.murmur.onInit((data) => {
      setSettings(data);
      settingsRef.current = data;
      setHistory(data.history || []);
      setUsage(data.usage || { count: 0 });
      setFreeLimit(data.freeLimit || 10000);
      setStats(data.stats);
      if (!data.onboardingDone) {
        setShowOnboarding(true);
      }
    });

    window.murmur.onNavigate((p) => setPage(p));

    // Toggle recording from main process (shortcut or tray click)
    window.murmur.onToggleRecording(() => {
      if (!isRecordingRef.current) {
        isRecordingRef.current = true;
        setIsRecording(true);
        doStartRecording();
      } else {
        isRecordingRef.current = false;
        setIsRecording(false);
        doStopRecording();
      }
    });
  }, [doStartRecording, doStopRecording]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    window.murmur.saveSettings({ onboardingDone: true });
    window.murmur.getSettings().then(s => {
      setSettings(s);
      setUsage(s.usage);
    });
  }, []);

  const handleSettingsChange = useCallback(async (newSettings) => {
    await window.murmur.saveSettings(newSettings);
    const updated = await window.murmur.getSettings();
    setSettings(updated);
  }, []);

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!settings) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Titlebar />
      <div className="app-body">
        <Sidebar
          page={page}
          onNavigate={setPage}
          usage={usage}
          freeLimit={freeLimit}
          userPlan={settings?.userPlan}
        />
        <div className="main-content">
          {page === 'home' && (
            <Home
              isRecording={isRecording}
              onToggle={() => window.murmur.toggleRecording()}
              stats={stats}
              history={history}
              settings={settings}
              onContextChange={(ctx) => handleSettingsChange({ context: ctx })}
              usage={usage}
              freeLimit={freeLimit}
              lastError={lastError}
            />
          )}
          {page === 'history' && (
            <History
              history={history}
              onRefresh={async () => {
                const h = await window.murmur.getHistory();
                setHistory(h);
              }}
              onClear={async () => {
                window.murmur.clearHistory();
                setHistory([]);
              }}
            />
          )}
          {page === 'settings' && (
            <Settings
              settings={settings}
              onChange={handleSettingsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
