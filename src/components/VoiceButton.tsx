"use client";

import { useTranslations } from "next-intl";
import { Mic, Square, Loader2 } from "lucide-react";
import { RecordingState } from "@/lib/types";

interface VoiceButtonProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
}

export default function VoiceButton({ state, onStart, onStop }: VoiceButtonProps) {
  const t = useTranslations("voice");
  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <div className="absolute w-24 h-24 rounded-full bg-recording/20 animate-pulse-ring" />
          <div className="absolute w-24 h-24 rounded-full bg-recording/20 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
        </>
      )}
      <button
        onClick={isRecording ? onStop : onStart}
        disabled={isProcessing}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
          isRecording
            ? "bg-recording shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110"
            : isProcessing
            ? "bg-muted cursor-not-allowed"
            : "bg-accent hover:bg-accent-light shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] hover:scale-105"
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        ) : isRecording ? (
          <Square className="w-7 h-7 text-white fill-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>
      <p className="absolute -bottom-8 text-sm text-muted-foreground whitespace-nowrap">
        {isRecording ? t("recording") : isProcessing ? t("processing") : t("clickToStart")}
      </p>
    </div>
  );
}
