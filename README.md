# Murmur — Say it. Done.

AI voice dictation that removes filler words, fixes grammar, and formats your speech into clean, professional text — instantly.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app runs in **mock mode** by default — no API keys needed.

## How It Works

1. Go to `/app`
2. Hold **Space** to speak (or click the mic button)
3. Release — polished text appears and is auto-copied to clipboard

## Switch to Real APIs

1. Copy `.env.example` to `.env.local`
2. Get API keys:
   - **Groq** (ASR): https://console.groq.com/keys
   - **OpenAI** (LLM): https://platform.openai.com/api-keys
3. Set `NEXT_PUBLIC_USE_MOCK=false` and fill in your keys
4. Restart the dev server

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **ASR:** Groq Whisper large-v3-turbo ($0.04/hour)
- **LLM:** OpenAI GPT-4o mini (post-processing)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── app/page.tsx          # Dictation workspace
│   └── api/
│       ├── transcribe/       # ASR endpoint (Groq Whisper / mock)
│       └── polish/           # LLM endpoint (GPT-4o mini / mock)
├── components/
│   ├── VoiceButton.tsx       # Push-to-talk with pulse animation
│   ├── WaveformVisualizer.tsx # Real-time audio bars
│   └── TranscriptPanel.tsx   # Raw/polished output
└── lib/
    ├── types.ts
    ├── prompts.ts            # LLM system prompts
    └── mock.ts               # Demo data
```

## Docs

- [PRD](docs/PRD.md) — Full product spec
- [Product Review](docs/product-review-2026-03-06.md) — Competitive audit
- [Pre-Delivery Gate](docs/pre-delivery-gate-2026-03-06.md) — Quality assessment
