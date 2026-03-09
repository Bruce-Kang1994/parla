"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Mic,
  Zap,
  Globe,
  Shield,
  Sparkles,
  MessageSquare,
  Mail,
  FileText,
  Code,
  Check,
  Menu,
  X,
  ChevronDown,
  Timer,
  Keyboard,
  Download,
  Monitor,
  Terminal,
} from "lucide-react";

// Demo examples (language-agnostic, always show all 3)
const DEMO_EXAMPLES = [
  {
    label: "\u4e2d\u6587",
    raw: "\u55ef \u6211\u60f3\u8bf4\u7684\u662f \u5c31\u662f\u90a3\u4e2a \u6211\u4eec\u9700\u8981\u5728\u4e0b\u5468\u4e00\u4e4b\u524d \u4e0d\u5bf9 \u5e94\u8be5\u662f\u5468\u4e09\u4e4b\u524d \u628a\u90a3\u4e2a\u8bbe\u8ba1\u7a3f\u7ed9\u5230\u5f00\u53d1\u56e2\u961f",
    polished: "\u6211\u4eec\u9700\u8981\u5728\u5468\u4e09\u4e4b\u524d\u628a\u8bbe\u8ba1\u7a3f\u7ed9\u5230\u5f00\u53d1\u56e2\u961f\u3002",
  },
  {
    label: "English",
    raw: "So like I was thinking we should um probably move the deadline to uh Friday no wait actually Thursday would be better",
    polished: "We should move the deadline to Thursday.",
  },
  {
    label: "\u65e5\u672c\u8a9e",
    raw: "\u3048\u3063\u3068 \u305d\u306e\u4ef6\u306a\u3093\u3067\u3059\u3051\u3069 \u3042\u306e\u30c7\u30b6\u30a4\u30f3\u3092 \u3084\u3063\u3071\u308a\u5148\u65b9\u306b\u50be\u305f\u611f\u3058\u306b \u3042 \u3082\u3046\u5c11\u3057\u4e38\u307f\u3092\u5e2f\u3073\u305f\u30c7\u30b6\u30a4\u30f3\u306b\u5909\u66f4\u3057\u3066\u304f\u3060\u3055\u3044",
    polished: "\u305d\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u3001\u3082\u3046\u5c11\u3057\u4e38\u307f\u3092\u5e2f\u3073\u305f\u30c7\u30b6\u30a4\u30f3\u306b\u5909\u66f4\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  },
];

function AnimatedDemo({ t }: { t: (key: string) => string }) {
  const [activeExample, setActiveExample] = useState(0);
  const [phase, setPhase] = useState<"typing" | "processing" | "result">("typing");
  const [visibleChars, setVisibleChars] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const example = DEMO_EXAMPLES[activeExample];

  useEffect(() => {
    setPhase("typing");
    setVisibleChars(0);
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      charIndex++;
      setVisibleChars(charIndex);
      if (charIndex >= example.raw.length) {
        clearInterval(typeInterval);
        timerRef.current = setTimeout(() => {
          setPhase("processing");
          timerRef.current = setTimeout(() => setPhase("result"), 800);
        }, 600);
      }
    }, 30);
    return () => {
      clearInterval(typeInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeExample, example.raw.length]);

  useEffect(() => {
    if (phase !== "result") return;
    const timer = setTimeout(() => {
      setActiveExample((prev) => (prev + 1) % DEMO_EXAMPLES.length);
    }, 3000);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl shadow-accent/5">
      <div className="flex items-center gap-1 px-4 pt-4 pb-0">
        {DEMO_EXAMPLES.map((ex, i) => (
          <button
            key={ex.label}
            onClick={() => setActiveExample(i)}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all ${
              i === activeExample ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {ex.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 pr-1">
          <div className="w-2.5 h-2.5 rounded-full bg-recording/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
      </div>
      <div className="p-6 min-h-[200px]">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-3.5 h-3.5 text-recording" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("youSaid")}</span>
            {phase === "typing" && <span className="inline-block w-1.5 h-4 bg-recording/80 animate-pulse ml-0.5" />}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {example.raw.slice(0, visibleChars)}
            {phase === "typing" && visibleChars < example.raw.length && (
              <span className="inline-block w-0.5 h-4 bg-muted-foreground/50 animate-pulse ml-px" />
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          {phase === "processing" ? (
            <div className="flex items-center gap-2 text-xs text-accent-light">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> {t("processing")}
            </div>
          ) : phase === "result" ? (
            <div className="flex items-center gap-2 text-xs text-success">
              <Check className="w-3.5 h-3.5" /> {t("done")}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5" /> {t("waiting")}
            </div>
          )}
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className={`transition-all duration-500 ${phase === "result" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent-light" />
            <span className="text-xs text-accent-light uppercase tracking-wider">{t("output")}</span>
          </div>
          <p className="text-[15px] text-foreground leading-relaxed font-medium">{example.polished}</p>
        </div>
      </div>
    </div>
  );
}

function SpeedComparison({ t }: { t: (key: string) => string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Keyboard className="w-4 h-4" /><span>{t("typing")}</span></div>
          <span className="text-muted-foreground font-mono">~40 WPM</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted-foreground/40 rounded-full transition-all duration-1000 ease-out" style={{ width: visible ? "17%" : "0%" }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Mic className="w-4 h-4" /><span>{t("regularStt")}</span></div>
          <span className="text-muted-foreground font-mono">~150 WPM</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted-foreground/60 rounded-full transition-all duration-1000 ease-out delay-200" style={{ width: visible ? "62%" : "0%" }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-foreground font-medium"><Zap className="w-4 h-4 text-accent-light" /><span>{t("murmur")}</span></div>
          <span className="text-accent-light font-mono font-bold">~150 WPM</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000 ease-out delay-400" style={{ width: visible ? "62%" : "0%", background: "linear-gradient(90deg, #2563eb, #3b82f6)" }} />
        </div>
        <p className="text-xs text-accent-light/70">{t("sameSpeed")}</p>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-[15px] font-medium text-foreground group-hover:text-accent-light transition-colors pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-5 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

/* Brand icon SVGs — simplified but recognizable */
function BrandIcon({ d, viewBox = "0 0 24 24", fill = "currentColor", size = 24 }: { d: string; viewBox?: string; fill?: string; size?: number }) {
  return <svg width={size} height={size} viewBox={viewBox} fill={fill}><path d={d} /></svg>;
}

const MARQUEE_ICONS: { label: string; bg: string; icon: React.ReactNode }[] = [
  { label: "GitHub", bg: "#24292e", icon: <BrandIcon fill="#fff" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" /> },
  { label: "LinkedIn", bg: "#0A66C2", icon: <BrandIcon fill="#fff" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.064 2.064 0 11-.001-4.128 2.064 2.064 0 01.001 4.128zm1.782 13.019H3.555V9h3.564v11.452z" /> },
  { label: "Slack", bg: "#4A154B", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.523h-6.315z" fill="#fff"/></svg> },
  { label: "Notion", bg: "#000", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.1 2.161c-.42-.326-.98-.7-2.055-.607L3.01 2.621c-.467.047-.56.28-.374.466l1.823 1.121zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933l3.222-.187zM2.877 1.168l13.728-1.02c1.682-.14 2.1.093 2.8.607l3.876 2.708c.467.327.607.747.607 1.26v17.865c0 1.073-.373 1.726-1.729 1.82L6.147 25.35c-1.027.047-1.54-.093-2.054-.746L1.383 21.16c-.56-.7-.793-1.213-.793-1.866V2.848c0-.84.374-1.54 1.26-1.68z" fill="#fff" fillRule="evenodd"/></svg> },
  { label: "Figma", bg: "#F24E1E", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 8.943v-7.472h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49h-1.471a3.278 3.278 0 01-3.117-1.508zm1.471 0h3.117c1.665 0 3.019-1.354 3.019-3.019 0-1.665-1.354-3.019-3.019-3.019h-3.117v6.038zM8.148 8.981H3.56c-2.476 0-4.49-2.015-4.49-4.491S1.084 0 3.56 0h4.588v8.981zM3.56 1.471c-1.665 0-3.019 1.354-3.019 3.019s1.354 3.019 3.019 3.019h3.117V1.471H3.56zm4.588 22.058c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h1.471c1.665 0 3.019 1.354 3.019 3.019v1.471c0 2.476-2.014 4.49-4.49 4.49zm0-7.509c-1.665 0-3.019 1.354-3.019 3.019s1.354 3.019 3.019 3.019 3.019-1.354 3.019-3.019v-3.019H8.148zm0-1.471H3.56c-2.476 0-4.49-2.014-4.49-4.49S1.084 9.57 3.56 9.57h4.588v11.979zM3.56 11.04c-1.665 0-3.019 1.354-3.019 3.019s1.354 3.019 3.019 3.019h3.117V11.04H3.56z"/></svg> },
  { label: "VS Code", bg: "#007ACC", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 00-1.276.057L.327 7.261A1 1 0 00.326 8.74L3.899 12 .326 15.26a1 1 0 00.001 1.479L1.65 17.94a.999.999 0 001.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 001.704.29l4.942-2.377A1.5 1.5 0 0024 20.06V3.939a1.5 1.5 0 00-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg> },
  { label: "Discord", bg: "#5865F2", icon: <BrandIcon fill="#fff" d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /> },
  { label: "Gmail", bg: "#EA4335", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg> },
  { label: "Chrome", bg: "#4285F4", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0112 6.545h10.691A12 12 0 0012 0zM1.931 5.47A11.943 11.943 0 000 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 01-6.865-2.29L1.931 5.47zm13.342 2.166a5.446 5.446 0 011.272 7.348l-3.956 6.85A12.014 12.014 0 0024 12c0-1.54-.29-3.011-.818-4.364h-7.909zM12 8.009a3.991 3.991 0 100 7.982 3.991 3.991 0 000-7.982z"/></svg> },
  { label: "Cursor", bg: "#000", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5.5 3l13 9-13 9V3z" fill="#fff"/></svg> },
  { label: "Obsidian", bg: "#7C3AED", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 1L3 7.5V16.5L12 23L21 16.5V7.5L12 1ZM12 3.5L18.5 8L12 12.5L5.5 8L12 3.5ZM5 9.5L11.5 14V20.5L5 16V9.5ZM12.5 20.5V14L19 9.5V16L12.5 20.5Z"/></svg> },
  { label: "Telegram", bg: "#26A5E4", icon: <BrandIcon fill="#fff" d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /> },
  { label: "WeChat", bg: "#07C160", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.97 2.885c-4.102 0-7.438 2.804-7.438 6.258 0 3.453 3.336 6.258 7.438 6.258.818 0 1.602-.12 2.338-.341a.72.72 0 01.586.08l1.544.907a.263.263 0 00.135.044c.131 0 .237-.108.237-.241 0-.06-.023-.117-.039-.174l-.314-1.197a.487.487 0 01.175-.543c1.507-1.106 2.476-2.735 2.476-4.543 0-3.454-3.336-6.258-7.438-6.258zm-2.063 3.11c.534 0 .968.44.968.982a.976.976 0 01-.968.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982zm4.127 0c.534 0 .968.44.968.982a.976.976 0 01-.968.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/></svg> },
  { label: "Linear", bg: "#5E6AD2", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M1.04 11.2a.985.985 0 00.237 1.07l10.453 10.453a.985.985 0 001.07.237A11.966 11.966 0 0024 12c0-6.627-5.373-12-12-12C5.862 0 1.15 7.036 1.04 11.2zM12 3.6A8.4 8.4 0 0120.4 12 8.4 8.4 0 0112 20.4a8.371 8.371 0 01-4.996-1.643L16.757 9.004a1.2 1.2 0 000-1.697l-.064-.064a1.2 1.2 0 00-1.697 0L5.243 17.004A8.371 8.371 0 013.6 12 8.4 8.4 0 0112 3.6z"/></svg> },
];

function AppMarquee() {
  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 overflow-hidden py-8">
      <div className="flex animate-marquee">
        {[...MARQUEE_ICONS, ...MARQUEE_ICONS].map((app, i) => (
          <div key={`${app.label}-${i}`} className="flex-shrink-0 mx-5">
            <div
              className="w-11 h-11 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: app.bg }}
              title={app.label}
            >
              {app.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations();

  const features = [
    { icon: <Sparkles className="w-6 h-6" />, title: t("features.smartCleanup"), desc: t("features.smartCleanupDesc") },
    { icon: <MessageSquare className="w-6 h-6" />, title: t("features.contextAware"), desc: t("features.contextAwareDesc") },
    { icon: <Globe className="w-6 h-6" />, title: t("features.languages"), desc: t("features.languagesDesc") },
    { icon: <Zap className="w-6 h-6" />, title: t("features.fast"), desc: t("features.fastDesc") },
    { icon: <Shield className="w-6 h-6" />, title: t("features.privacy"), desc: t("features.privacyDesc") },
    { icon: <Keyboard className="w-6 h-6" />, title: t("features.globalHotkey"), desc: t("features.globalHotkeyDesc") },
  ];

  const steps = [
    { step: "01", icon: <Keyboard className="w-8 h-8" />, title: t("howItWorks.step1"), desc: t("howItWorks.step1Desc") },
    { step: "02", icon: <Sparkles className="w-8 h-8" />, title: t("howItWorks.step2"), desc: t("howItWorks.step2Desc") },
    { step: "03", icon: <Zap className="w-8 h-8" />, title: t("howItWorks.step3"), desc: t("howItWorks.step3Desc") },
  ];

  const faqItems = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  const freeFeatures = [t("pricing.freeFeature1"), t("pricing.freeFeature2"), t("pricing.freeFeature3"), t("pricing.freeFeature4")];
  const proFeatures = [t("pricing.proFeature1"), t("pricing.proFeature2"), t("pricing.proFeature3"), t("pricing.proFeature4"), t("pricing.proFeature5"), t("pricing.proFeature6")];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Floating Pill Nav */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl">
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-white/90 backdrop-blur-xl rounded-full shadow-lg shadow-black/[0.06] border border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold">Parla</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1">{t("nav.features")}</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1">{t("nav.pricing")}</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1">{t("nav.faq")}</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <a href="#download" className="px-4 py-1.5 rounded-full bg-foreground hover:bg-foreground/90 text-background text-sm font-medium transition-all flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t("nav.download")}</span>
            </a>
            <button
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-border/60 px-5 py-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-1.5">{t("nav.features")}</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-1.5">{t("nav.howItWorks")}</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-1.5">{t("nav.pricing")}</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-1.5">{t("nav.faq")}</a>
          </div>
        )}
      </nav>

      {/* Hero — Clean white, giant typography */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted text-sm text-muted-foreground mb-8 animate-in fade-in duration-700">
            <Sparkles className="w-4 h-4 text-accent-light" /> {t("hero.badge")}
          </div>
          <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.05]">
              {t("hero.title1")}
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] gradient-text">
              {t("hero.title2")}
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {t("hero.subtitle")}
          </p>
          <div className="flex items-center justify-center mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <a href="#download" className="group px-8 py-3.5 rounded-full bg-foreground hover:bg-foreground/90 text-background text-lg font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 flex items-center gap-2">
              <Download className="w-5 h-5" /> {t("hero.cta")}
            </a>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-4 animate-in fade-in duration-700 delay-700">{t("hero.comingSoon")}</p>
        </div>
        <div className="max-w-3xl mx-auto mt-16">
          <AnimatedDemo t={(key) => t(`demo.${key}`)} />
        </div>
      </section>

      {/* Speed */}
      <section className="py-24 px-6 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {t("speed.title1")}<span className="gradient-text">{t("speed.title2")}</span>{t("speed.title3")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">{t("speed.subtitle")}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-accent-light" /><span>{t("speed.subSecond")}</span></div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent-light" /><span>{t("speed.aiPolished")}</span></div>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-8">
              <SpeedComparison t={(key) => t(`speed.${key}`)} />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("features.title1")} <span className="gradient-text">{t("features.title2")}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("features.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group bg-surface border border-border rounded-xl p-6 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent-light flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("howItWorks.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("howItWorks.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent-light flex items-center justify-center mx-auto mb-5">{item.icon}</div>
                <span className="text-xs text-accent-light font-mono font-bold block mb-2">{item.step}</span>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Works everywhere */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("worksEverywhere.title")}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("worksEverywhere.subtitle")}</p>
          </div>
        </div>
        <AppMarquee />
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("pricing.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-surface border border-border rounded-2xl p-8">
              <h3 className="text-lg font-semibold mb-1">{t("pricing.free")}</h3>
              <p className="text-muted-foreground text-sm mb-6">{t("pricing.freeDesc")}</p>
              <div className="mb-6"><span className="text-4xl font-bold">$0</span><span className="text-muted-foreground">{t("pricing.perMonth")}</span></div>
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-success flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <a href="#download" className="block w-full text-center py-2.5 rounded-full border border-border text-foreground font-medium hover:bg-surface-hover transition-colors">{t("pricing.getStarted")}</a>
            </div>
            <div className="bg-surface border-2 border-accent rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent rounded-full text-xs font-medium text-white">{t("pricing.popular")}</div>
              <h3 className="text-lg font-semibold mb-1">{t("pricing.pro")}</h3>
              <p className="text-muted-foreground text-sm mb-6">{t("pricing.proDesc")}</p>
              <div className="mb-6"><span className="text-4xl font-bold">$8</span><span className="text-muted-foreground">{t("pricing.perMonth")}</span></div>
              <ul className="space-y-3 mb-8">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground"><Check className="w-4 h-4 text-accent-light flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <a href="#download" className="block w-full text-center py-2.5 rounded-full bg-accent hover:bg-accent-light text-white font-medium transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">{t("pricing.startTrial")}</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("faq.title")}</h2>
          </div>
          <div className="bg-surface border border-border rounded-2xl px-6 sm:px-8 divide-y divide-border">
            {faqItems.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="py-24 px-6 bg-surface/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("cta.title1")} <span className="gradient-text">{t("cta.title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">{t("cta.subtitle")}</p>
          <a href="#download" className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-foreground hover:bg-foreground/90 text-background text-lg font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10">
            <Download className="w-5 h-5" /> {t("cta.button")}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center"><Mic className="w-3 h-3 text-white" /></div>
            <span>Parla</span>
          </div>
          <p>{t("footer.tagline")}</p>
        </div>
      </footer>
    </div>
  );
}
