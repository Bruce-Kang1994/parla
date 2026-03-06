export interface TranscriptionResult {
  raw: string;
  polished: string;
  language: string;
  duration: number;
}

export interface PolishOptions {
  context: "email" | "chat" | "document" | "code" | "general";
  tone: "formal" | "casual" | "professional";
  language: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  raw: string;
  polished: string;
  context: string;
  duration: number;
}

export type RecordingState = "idle" | "recording" | "processing" | "done";
