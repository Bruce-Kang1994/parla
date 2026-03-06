"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, History, Trash2, Keyboard, X, Mic } from "lucide-react";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import VoiceButton from "@/components/VoiceButton";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import TranscriptPanel from "@/components/TranscriptPanel";
import { RecordingState, HistoryItem } from "@/lib/types";

type ContextType = "email" | "chat" | "document" | "code" | "general";

const HISTORY_KEY = "parla_history";

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export default function AppPage() {
  const t = useTranslations();
  const [state, setState] = useState<RecordingState>("idle");
  const [raw, setRaw] = useState("");
  const [polished, setPolished] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [context, setContext] = useState<ContextType>("general");
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const contextRef = useRef<ContextType>(context);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const processAudioRef = useRef<(blob: Blob) => Promise<void>>(undefined);

  useEffect(() => { contextRef.current = context; }, [context]);
  useEffect(() => { saveHistory(history); }, [history]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "";
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interim += event.results[i][0].transcript;
        }
        setLiveTranscript(interim);
      };
      recognition.onerror = () => {};
      recognition.onend = () => {
        if (isRecordingRef.current) {
          try { recognition.start(); } catch { /* already started */ }
        }
      };
      recognition.start();
      recognitionRef.current = recognition;
    } catch { /* Web Speech API not available */ }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
    setLiveTranscript("");
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (audioCtxRef.current?.state === "closed") audioCtxRef.current = null;
      const audioCtx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
      });
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudioRef.current?.(audioBlob);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      isRecordingRef.current = true;
      setState("recording");
      setRaw(""); setPolished(""); setCopied(false); setLiveTranscript("");
      startSpeechRecognition();
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
    } catch {
      setError(t("app.micDenied"));
    }
  }, [startSpeechRecognition, t]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setAnalyser(null);
    setState("processing");
    stopSpeechRecognition();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, [stopSpeechRecognition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isRecordingRef.current) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        startRecording();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isRecordingRef.current) { e.preventDefault(); stopRecording(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [startRecording, stopRecording]);

  processAudioRef.current = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!transcribeRes.ok) throw new Error("Transcription failed");
      const transcribeData = await transcribeRes.json();
      const rawText = transcribeData.raw;
      setRaw(rawText);
      const polishRes = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: rawText, context: contextRef.current }),
      });
      if (!polishRes.ok) throw new Error("Polish failed");
      const polishData = await polishRes.json();
      setPolished(polishData.polished);
      try {
        await navigator.clipboard.writeText(polishData.polished);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch { /* Clipboard unavailable */ }
      const item: HistoryItem = {
        id: Date.now().toString(), timestamp: Date.now(), raw: rawText,
        polished: polishData.polished, context: contextRef.current, duration: transcribeData.duration || 0,
      };
      setHistory((prev) => [item, ...prev].slice(0, 50));
      setState("done");
    } catch (err) {
      console.error("Processing error:", err);
      setError(t("app.somethingWrong"));
      setState("idle");
    }
  };

  const contexts: { key: ContextType; label: string }[] = [
    { key: "general", label: t("app.general") },
    { key: "email", label: t("app.email") },
    { key: "chat", label: t("app.chat") },
    { key: "document", label: t("app.document") },
    { key: "code", label: t("app.code") },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-surface transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold"><span className="gradient-text">Parla</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-lg transition-colors ${showHistory ? "bg-accent/20 text-accent-light" : "hover:bg-surface text-muted-foreground hover:text-foreground"}`}>
            <History className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 gap-8 sm:gap-10">
          {error && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-recording/10 border border-recording/30 text-recording rounded-xl text-sm animate-in fade-in slide-in-from-top-2 duration-300 max-w-md text-center">{error}</div>
          )}

          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 bg-surface rounded-xl p-1.5">
            {contexts.map((c) => (
              <button key={c.key} onClick={() => setContext(c.key)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${context === c.key ? "bg-accent text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"}`}>
                {c.label}
              </button>
            ))}
          </div>

          <WaveformVisualizer isActive={state === "recording"} analyser={analyser} />

          {state === "recording" && liveTranscript && (
            <div className="w-full max-w-2xl animate-in fade-in duration-300">
              <div className="bg-surface/50 border border-border/50 rounded-xl px-5 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Mic className="w-3 h-3 text-recording animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("app.live")}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {liveTranscript}
                  <span className="inline-block w-0.5 h-3.5 bg-muted-foreground/50 animate-pulse ml-0.5 align-text-bottom" />
                </p>
              </div>
            </div>
          )}

          {state === "recording" && (
            <p className="text-sm font-mono text-recording tabular-nums">
              {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:{(recordingDuration % 60).toString().padStart(2, "0")}
            </p>
          )}

          <VoiceButton state={state} onStart={startRecording} onStop={stopRecording} />

          {state === "idle" && !polished && (
            <div className="text-center space-y-3 max-w-sm">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Keyboard className="w-4 h-4" />
                <span>{t("app.holdSpace", { key: "Space" })}</span>
              </div>
              <p className="text-xs text-muted-foreground/60">{t("app.orClickMic")}</p>
            </div>
          )}

          {state === "processing" && (
            <div className="w-full max-w-2xl space-y-3 animate-in fade-in duration-300">
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="h-3 w-16 bg-muted rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-full" />
                  <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/5" />
                </div>
              </div>
            </div>
          )}

          <TranscriptPanel raw={raw} polished={polished} />

          {copied && <p className="text-xs text-success animate-in fade-in duration-300">{t("app.copiedToClipboard")}</p>}
        </main>

        {showHistory && (
          <>
            <div className="md:hidden fixed inset-0 z-40 bg-black/60 animate-in fade-in duration-200" onClick={() => setShowHistory(false)} />
            <aside className="fixed md:relative right-0 top-0 md:top-auto h-full z-50 md:z-auto w-80 max-w-[85vw] border-l border-border bg-surface md:bg-surface/50 overflow-y-auto animate-in slide-in-from-right-4 duration-300">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{t("app.history")}</h2>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button onClick={() => setHistory([])} className="text-xs text-muted-foreground hover:text-recording transition-colors flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> {t("app.clear")}
                    </button>
                  )}
                  <button onClick={() => setShowHistory(false)} className="md:hidden p-1 rounded hover:bg-surface-hover text-muted-foreground"><X className="w-4 h-4" /></button>
                </div>
              </div>
              {history.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">{t("app.noHistory")}</p>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((item) => (
                    <button key={item.id} onClick={() => { setRaw(item.raw); setPolished(item.polished); setState("done"); setShowHistory(false); }}
                      className="w-full text-left p-4 hover:bg-surface-hover transition-colors">
                      <p className="text-sm text-foreground line-clamp-2 mb-1">{item.polished}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleTimeString()} · {item.context}</p>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
