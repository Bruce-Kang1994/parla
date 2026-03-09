import { useState, useEffect, useRef, useCallback } from 'react';

const TOTAL_STEPS = 6;

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: '自动检测', desc: '根据语音自动识别语言' },
  { value: 'zh', label: '中文', desc: 'Chinese' },
  { value: 'en', label: 'English', desc: '英语' },
  { value: 'ja', label: '日本語', desc: '日语' },
  { value: 'ko', label: '한국어', desc: '韩语' },
  { value: 'fr', label: 'Français', desc: '法语' },
  { value: 'de', label: 'Deutsch', desc: '德语' },
  { value: 'es', label: 'Español', desc: '西班牙语' },
];

function StepDots({ current }) {
  return (
    <div className="onboarding-step">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={`onboarding-dot ${i === current ? 'active' : i < current ? 'done' : ''}`}
        />
      ))}
    </div>
  );
}

function Confetti() {
  const colors = ['#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#F97316'];
  return (
    <>
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 1}s`,
            animationDuration: `${2 + Math.random() * 1.5}s`,
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </>
  );
}

// Step 0: Welcome
function WelcomeStep({ onNext }) {
  return (
    <div className="fade-in">
      <div className="onboarding-icon">&#127908;</div>
      <h2>Parla</h2>
      <p>开口即文字。只需几步设置，即可开始用语音高效输入。</p>
      <div className="onboarding-actions">
        <button className="btn btn-primary" onClick={onNext} style={{ padding: '10px 32px', fontSize: 14 }}>
          开始设置
        </button>
      </div>
    </div>
  );
}

// Step 1: Login / Register (email OTP)
function LoginStep({ onNext, onBack }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState('email'); // email | otp | done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await window.murmur.authLogin(email.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setPhase('otp');
      }
    } catch {
      setError('发送失败，请检查网络');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('请输入验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await window.murmur.authVerify({ email: email.trim(), token: otp.trim() });
      if (result.error) {
        setError(result.error);
      } else if (result.session) {
        setPhase('done');
        setTimeout(onNext, 600);
      } else {
        setError('验证失败');
      }
    } catch {
      setError('验证失败，请检查网络');
    }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="onboarding-icon">&#128231;</div>
      <h2>登录 / 注册</h2>
      <p>输入邮箱，我们会发送验证码完成登录</p>
      <div style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
        {phase === 'email' && (
          <>
            <input
              type="email"
              className="input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              autoFocus
            />
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{error}</div>
            )}
          </>
        )}
        {phase === 'otp' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              验证码已发送至 <strong>{email}</strong>
            </div>
            <input
              type="text"
              className="input"
              placeholder="输入 6 位验证码"
              value={otp}
              onChange={(e) => { setOtp(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              autoFocus
              maxLength={6}
              style={{ letterSpacing: 4, textAlign: 'center', fontSize: 18 }}
            />
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{error}</div>
            )}
            <div
              style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer', marginTop: 8 }}
              onClick={() => { setPhase('email'); setOtp(''); setError(''); }}
            >
              更换邮箱
            </div>
          </>
        )}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', color: 'var(--success)', fontSize: 14, fontWeight: 500 }}>
            登录成功
          </div>
        )}
      </div>
      <div className="onboarding-actions">
        <button className="btn btn-secondary" onClick={onBack}>上一步</button>
        {phase === 'email' && (
          <button
            className="btn btn-primary"
            onClick={handleSendOtp}
            disabled={loading || !email.trim()}
          >
            {loading ? '发送中...' : '发送验证码'}
          </button>
        )}
        {phase === 'otp' && (
          <button
            className="btn btn-primary"
            onClick={handleVerifyOtp}
            disabled={loading || !otp.trim()}
          >
            {loading ? '验证中...' : '验证'}
          </button>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          已有账号？直接登录
        </span>
      </div>
    </div>
  );
}

// Step 2: Permissions
function PermissionsStep({ onNext, onBack }) {
  const [perms, setPerms] = useState({ microphone: false, accessibility: false });
  const [checking, setChecking] = useState(false);

  const checkPerms = useCallback(async () => {
    setChecking(true);
    const p = await window.murmur.checkPermissions();
    setPerms(p);
    setChecking(false);
  }, []);

  useEffect(() => {
    checkPerms();
    const interval = setInterval(checkPerms, 2000);
    return () => clearInterval(interval);
  }, [checkPerms]);

  const allGranted = perms.microphone && perms.accessibility;

  return (
    <div className="fade-in">
      <div className="onboarding-icon">&#128274;</div>
      <h2>系统权限</h2>
      <p>Parla 需要以下权限才能正常工作</p>
      <div className="perm-list">
        <div className="perm-item">
          <div>
            <div className="perm-name">麦克风</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>仅在你主动按下快捷键时录音，不后台监听</div>
          </div>
          {perms.microphone ? (
            <span className="badge badge-success">已授权</span>
          ) : (
            <span className="perm-action" onClick={() => window.murmur.requestMicPermission()}>授权</span>
          )}
        </div>
        <div className="perm-item">
          <div>
            <div className="perm-name">辅助功能</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>将识别结果粘贴到你正在输入的位置（不读取屏幕内容）</div>
          </div>
          {perms.accessibility ? (
            <span className="badge badge-success">已授权</span>
          ) : (
            <span className="perm-action" onClick={() => window.murmur.openAccessibilitySettings()}>去设置</span>
          )}
        </div>
      </div>
      <div className="onboarding-actions">
        <button className="btn btn-secondary" onClick={onBack}>上一步</button>
        <button className="btn btn-primary" onClick={onNext}>
          {allGranted ? '继续' : '稍后设置，先继续'}
        </button>
      </div>
    </div>
  );
}

// Step 3: Language
function LanguageStep({ onNext, onBack }) {
  const [selected, setSelected] = useState('auto');

  const handleNext = async () => {
    await window.murmur.saveSettings({ language: selected });
    onNext();
  };

  return (
    <div className="fade-in">
      <div className="onboarding-icon">&#127760;</div>
      <h2>语音语言</h2>
      <p>选择你最常使用的语音输入语言</p>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {LANGUAGE_OPTIONS.map(lang => (
            <div
              key={lang.value}
              onClick={() => setSelected(lang.value)}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius)',
                border: selected === lang.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: selected === lang.value ? 'var(--primary-light, rgba(79,70,229,0.06))' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 14 }}>{lang.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{lang.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="onboarding-actions">
        <button className="btn btn-secondary" onClick={onBack}>上一步</button>
        <button className="btn btn-primary" onClick={handleNext}>继续</button>
      </div>
    </div>
  );
}

// Step 4: Try It
function TryItStep({ onNext, onBack }) {
  const [state, setState] = useState('idle'); // idle, recording, processing, done
  const [result, setResult] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setState('processing');
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const buffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((d, byte) => d + String.fromCharCode(byte), '')
        );
        const res = await window.murmur.processAudio({ audioBase64: base64, context: 'general' });
        if (res && !res.error) {
          setResult(res.polished);
          setState('done');
        } else {
          setResult(res?.error || '处理失败');
          setState('idle');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setState('recording');
    } catch (e) {
      console.error('Try-it recording failed:', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="fade-in">
      <div className="onboarding-icon">&#127775;</div>
      <h2>试一试</h2>
      <p>点击按钮说一句话，体验语音转文字</p>
      <div style={{ textAlign: 'center' }}>
        {state === 'idle' && (
          <button className="btn btn-primary" onClick={startRecording} style={{ padding: '10px 24px' }}>
            &#127908; 开始录音
          </button>
        )}
        {state === 'recording' && (
          <button className="btn btn-danger" onClick={stopRecording} style={{ padding: '10px 24px' }}>
            &#9209; 停止录音
          </button>
        )}
        {state === 'processing' && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>处理中...</div>
        )}
        {state === 'done' && result && (
          <div style={{
            background: 'var(--success-light)',
            borderRadius: 'var(--radius)',
            padding: 16,
            marginTop: 8,
            textAlign: 'left',
            fontSize: 14,
            color: 'var(--text)',
            lineHeight: 1.6,
          }}>
            {result}
          </div>
        )}
      </div>
      <div className="onboarding-actions">
        <button className="btn btn-secondary" onClick={onBack}>上一步</button>
        <button className="btn btn-primary" onClick={onNext}>
          {state === 'done' ? '完成设置' : '跳过'}
        </button>
      </div>
    </div>
  );
}

// Step 5: Complete
function CompleteStep({ onComplete, goToLogin }) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = async () => {
    const auth = await window.murmur.getAuthState();
    if (!auth.isLoggedIn) {
      goToLogin();
      return;
    }
    onComplete();
  };

  return (
    <div className="fade-in">
      {showConfetti && <Confetti />}
      <div className="onboarding-icon">&#127881;</div>
      <h2>设置完成!</h2>
      <p>
        现在你可以在任何应用中按下快捷键开始语音输入了。
        <br />
        文字会自动插入到光标位置。
      </p>
      <div className="onboarding-actions">
        <button
          className="btn btn-primary"
          onClick={handleStart}
          style={{ padding: '10px 32px', fontSize: 14 }}
        >
          开始使用
        </button>
      </div>
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <StepDots current={step} />
        {step === 0 && <WelcomeStep onNext={next} />}
        {step === 1 && <LanguageStep onNext={next} onBack={back} />}
        {step === 2 && <PermissionsStep onNext={next} onBack={back} />}
        {step === 3 && <TryItStep onNext={next} onBack={back} />}
        {step === 4 && <LoginStep onNext={next} onBack={back} />}
        {step === 5 && <CompleteStep onComplete={onComplete} goToLogin={() => setStep(4)} />}
      </div>
    </div>
  );
}
