"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

interface TranscriptPanelProps {
  raw: string;
  polished: string;
}

export default function TranscriptPanel({ raw, polished }: TranscriptPanelProps) {
  const t = useTranslations("transcript");
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(polished);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!polished) return null;

  return (
    <div className="w-full max-w-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative group">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-accent-light uppercase tracking-wider">{t("polished")}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={showRaw ? t("hideRaw") : t("showRaw")}
              >
                {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap text-[15px]">{polished}</p>
        </div>
      </div>
      {showRaw && (
        <div className="bg-surface/50 border border-border/50 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">{t("rawTranscript")}</span>
          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">{raw}</p>
        </div>
      )}
    </div>
  );
}
