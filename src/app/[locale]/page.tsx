"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
    raw: "\u3048\u3063\u3068 \u305d\u306e\u4ef6\u306a\u3093\u3067\u3059\u3051\u3069 \u3042\u306e\u30c7\u30b6\u30a4\u30f3\u3092 \u3084\u3063\u3071\u308a\u5148\u65b9\u306b\u50ae\u305f\u611f\u3058\u306b \u3042 \u3082\u3046\u5c11\u3057\u4e38\u307f\u3092\u5e2f\u3073\u305f\u30c7\u30b6\u30a4\u30f3\u306b\u5909\u66f4\u3057\u3066\u304f\u3060\u3055\u3044",
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
          <div className="h-full rounded-full transition-all duration-1000 ease-out delay-400" style={{ width: visible ? "62%" : "0%", background: "linear-gradient(90deg, #6366f1, #818cf8)" }} />
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

  const apps = [
    { icon: <Terminal className="w-5 h-5" />, label: "Claude Code", color: "text-amber-500" },
    { icon: <Code className="w-5 h-5" />, label: "Cursor", color: "text-purple-400" },
    { icon: <Monitor className="w-5 h-5" />, label: "Figma", color: "text-pink-400" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "WeChat", color: "text-emerald-400" },
    { icon: <Code className="w-5 h-5" />, label: "VS Code", color: "text-blue-400" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "Slack", color: "text-green-400" },
    { icon: <FileText className="w-5 h-5" />, label: "Notion", color: "text-amber-400" },
    { icon: <Mail className="w-5 h-5" />, label: "Gmail", color: "text-sky-400" },
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
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Parla</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.features")}</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.howItWorks")}</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.faq")}</a>
            <LanguageSwitcher />
            <Link href="/app" className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all">
              {t("nav.webDemo")}
            </Link>
            <a href="#download" className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-medium transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> {t("nav.download")}
            </a>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-surface text-muted-foreground">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface/95 backdrop-blur-lg px-6 py-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">{t("nav.features")}</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">{t("nav.howItWorks")}</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">{t("nav.pricing")}</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2">{t("nav.faq")}</a>
            <Link href="/app" className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-center">{t("nav.webDemo")}</Link>
            <a href="#download" className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium text-center flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" /> {t("nav.download")}</a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface text-sm text-muted-foreground mb-8 animate-in fade-in duration-700">
            <Sparkles className="w-4 h-4 text-accent-light" /> {t("hero.badge")}
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {t("hero.title1")} <span className="gradient-text">{t("hero.title2")}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <a href="#download" className="group px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-light text-white font-semibold text-lg transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-[1.02] flex items-center gap-2">
              <Download className="w-5 h-5" /> {t("hero.cta")}
            </a>
            <Link href="/app" className="px-8 py-3.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground font-medium text-lg transition-all">
              {t("hero.secondaryCta")}
            </Link>
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
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("worksEverywhere.title")}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("worksEverywhere.subtitle")}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {apps.map((item) => (
              <div key={item.label} className="bg-surface border border-border rounded-xl p-4 sm:p-5 text-center hover:border-accent/30 transition-all">
                <div className={`${item.color} flex justify-center mb-2`}>{item.icon}</div>
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
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
              <a href="#download" className="block w-full text-center py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-surface-hover transition-colors">{t("pricing.getStarted")}</a>
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
              <a href="#download" className="block w-full text-center py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">{t("pricing.startTrial")}</a>
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
      <section className="py-24 px-6 bg-surface/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("cta.title1")} <span className="gradient-text">{t("cta.title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">{t("cta.subtitle")}</p>
          <a href="#download" className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-light text-white font-semibold text-lg transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-[1.02]">
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
