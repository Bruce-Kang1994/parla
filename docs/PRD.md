# Murmur — Product Requirements Document

> Say it. Done.

---

## 1. Product Overview

**Murmur** is an AI-powered voice dictation tool that converts natural speech into polished, formatted text. Unlike basic transcription tools, Murmur uses a dual-engine pipeline (ASR + LLM) to intelligently clean, restructure, and format your voice into professional text.

### Vision
Replace typing as the primary text input method for knowledge workers.

### Target Users
- Professionals who write emails, Slack messages, documents daily
- Content creators and writers
- Developers writing comments/docs
- Multilingual workers

---

## 2. Architecture

### Core Pipeline

```
User Voice → [ASR Engine] → Raw Transcript → [LLM Post-Processing] → Polished Text → Clipboard
```

### Tech Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Framework | Next.js 16 (App Router) | Done |
| Language | TypeScript | Done |
| Styling | Tailwind CSS v4 | Done |
| Icons | Lucide React | Done |
| ASR Engine | Groq Whisper large-v3-turbo | Ready (mock active) |
| LLM Engine | OpenAI GPT-4o mini | Ready (mock active) |
| Audio Recording | Web MediaRecorder API | Done |
| Audio Visualization | Web Audio API + Canvas | Done |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/transcribe` | POST | Audio → raw text (Groq Whisper) |
| `/api/polish` | POST | Raw text → polished text (GPT-4o mini) |

### Environment Variables

```env
NEXT_PUBLIC_USE_MOCK=true    # Toggle mock/real mode
GROQ_API_KEY=                # Groq API for Whisper ASR
OPENAI_API_KEY=              # OpenAI API for LLM post-processing
```

---

## 3. Feature Spec

### 3.1 Voice Recording
- Push-to-talk: click to start, click to stop
- Real-time waveform visualization during recording
- Visual state machine: idle → recording → processing → done
- Pulse animation on record button

### 3.2 ASR (Automatic Speech Recognition)
- **Mock mode**: Returns pre-defined Chinese/English/Japanese samples
- **Real mode**: Groq Whisper large-v3-turbo API
  - $0.04/hour, 216x real-time speed
  - 100+ language support
  - Audio format: WebM Opus

### 3.3 LLM Post-Processing
- **Mock mode**: Returns pre-defined polished versions
- **Real mode**: OpenAI GPT-4o mini
  - Temperature: 0.3 (low creativity, high fidelity)
  - System prompt handles: filler removal, deduplication, self-correction detection, formatting

### 3.4 Context-Aware Modes
| Mode | Behavior |
|------|----------|
| General | Clean, natural text |
| Email | Professional, add greeting/closing if implied |
| Chat | Concise, conversational |
| Document | Well-structured prose with paragraphs |
| Code | Technical, precise, suitable for comments |

### 3.5 Auto-Clipboard
- Polished text is automatically copied to clipboard on completion
- Visual "Copied to clipboard" confirmation

### 3.6 History Panel
- Sidebar with recent transcriptions (up to 50)
- Click to re-view any past result
- Clear all option
- Shows timestamp and context mode

### 3.7 Transcript Panel
- Shows polished output by default
- Toggle to see raw transcript comparison
- One-click copy button

---

## 4. Pages

### Landing Page (`/`)
- Fixed glass navbar
- Hero: "Say it. Done." with gradient text
- Interactive demo preview (waveform + before/after)
- Features grid (6 cards)
- How it works (3 steps)
- Use cases (4 contexts)
- Pricing (Free + Pro)
- CTA footer

### App Page (`/app`)
- Full-screen dictation workspace
- Context selector (5 modes)
- Voice button with pulse animation
- Real-time waveform
- Transcript output
- History sidebar (collapsible)

---

## 5. Cost Analysis

### Per-User Cost (30 min daily usage)

| Component | Cost/Day | Cost/Month |
|-----------|----------|------------|
| Groq Whisper Turbo | $0.02 | $0.60 |
| GPT-4o mini | $0.01 | $0.30 |
| **Total** | **$0.03** | **$0.90** |

### Pricing Strategy

| Plan | Price | Margin |
|------|-------|--------|
| Free | $0 (5,000 words/week) | Loss leader |
| Pro | $8/month | ~88% gross margin |

### vs Competitors

| Product | Price | Our advantage |
|---------|-------|---------------|
| Typeless | $12/month | 33% cheaper |
| Wispr Flow | $12/month | 33% cheaper |
| Willow | $15/month | 47% cheaper |

---

## 6. Activation Checklist

### To switch from mock to real:

1. **Get API keys**:
   - Groq: https://console.groq.com/keys (free tier available)
   - OpenAI: https://platform.openai.com/api-keys

2. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_USE_MOCK=false
   GROQ_API_KEY=gsk_xxxxx
   OPENAI_API_KEY=sk-xxxxx
   ```

3. **Restart dev server**

4. **Test**: Click record, speak, verify real transcription + polish

### Optional upgrades:
- Replace GPT-4o mini with Claude Haiku 4.5 for potentially better multilingual support
- Add Deepgram Nova-3 as fallback ASR ($0.26/hour)
- Deploy to Vercel (free tier supports this stack)

---

## 7. Future Roadmap

### Phase 2 — Desktop App
- Tauri 2.0 macOS/Windows native app
- Global hotkey (e.g., Cmd+Shift+Space)
- System-level text paste (not just clipboard)
- Menu bar icon with recording indicator

### Phase 3 — Intelligence
- Per-user writing style learning
- Custom vocabulary / jargon dictionary
- Meeting transcription mode
- Voice commands ("delete last sentence", "make it more formal")

### Phase 4 — Platform
- API for developers
- Browser extension
- iOS/Android app
- Team/workspace features

---

## 8. File Structure

```
murmur/
├── src/
│   ├── app/
│   │   ├── globals.css           # Design system (dark theme, animations)
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── page.tsx              # Landing page
│   │   ├── app/
│   │   │   └── page.tsx          # Main dictation workspace
│   │   └── api/
│   │       ├── transcribe/
│   │       │   └── route.ts      # ASR endpoint (Groq Whisper / mock)
│   │       └── polish/
│   │           └── route.ts      # LLM endpoint (GPT-4o mini / mock)
│   ├── components/
│   │   ├── VoiceButton.tsx       # Push-to-talk button with states
│   │   ├── WaveformVisualizer.tsx # Real-time audio visualization
│   │   └── TranscriptPanel.tsx   # Raw/polished text display
│   └── lib/
│       ├── types.ts              # TypeScript types
│       ├── prompts.ts            # LLM system prompts
│       └── mock.ts               # Mock data for dev/demo
├── docs/
│   └── PRD.md                    # This document
├── .env.local                    # API keys (gitignored)
└── package.json
```
