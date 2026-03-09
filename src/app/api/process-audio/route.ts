import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekStartUTC } from "@/lib/supabase/auth-helper";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const ASR_MODEL = "whisper-large-v3-turbo";
const LLM_MODEL = "llama-3.3-70b-versatile";
const FREE_LIMIT = 6000;

function buildPolishPrompt(context: string): string {
  const ctxMap: Record<string, string> = {
    email:
      "Format as a professional email body. Use proper greeting/closing if implied.",
    chat: "Keep it concise and conversational. Use short sentences.",
    document:
      "Format as well-structured prose with proper paragraphs and punctuation.",
    code: "Format as a code comment or documentation. Be precise and technical.",
    general: "Format as clean, natural text.",
  };

  return `You are a voice-to-text cleanup tool. Your ONLY job is to clean up raw speech transcription. You must preserve ALL original content and meaning.

STRICT RULES:
1. Remove filler words: um, uh, like, you know, hmm, ah, well, so
2. When the speaker corrects themselves ("no wait", "I mean"), keep ONLY the corrected version
3. Merge repeated/stuttered phrases into one clean version
4. Add proper punctuation
5. If the speaker lists items, format as a list

ABSOLUTE PROHIBITIONS:
- NEVER summarize or shorten the content
- NEVER add information not in the original
- NEVER change the meaning or intent
- NEVER rephrase sentences in your own words
- NEVER translate between languages
- NEVER omit any topic or point the speaker mentioned

The output should read like what the speaker INTENDED to write, not a summary of what they said.

Context: ${ctxMap[context] || ctxMap.general}

Output ONLY the cleaned text. No explanations, no prefixes.`;
}

export async function POST(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json(
      { error: "服务端未配置 Groq API Key" },
      { status: 503 }
    );
  }

  let body: {
    audioBase64: string;
    context?: string;
    language?: string;
    authToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { audioBase64, context, language, authToken } = body;
  if (!audioBase64) {
    return NextResponse.json(
      { error: "Missing audioBase64" },
      { status: 400 }
    );
  }

  // 修复1：强制鉴权
  if (!authToken) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "服务未配置，请检查 Supabase 环境变量" },
      { status: 503 }
    );
  }

  const { data: authData } = await supabase.auth.getUser(authToken);
  if (!authData.user) {
    return NextResponse.json({ error: "登录已过期" }, { status: 401 });
  }

  const userId = authData.user.id;

  // 修复2：查询本周用量，检查是否超限
  const weekStart = getWeekStartUTC();
  const { data: usageRow } = await supabase
    .from("usage")
    .select("chars_count")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .single();

  const currentUsage = usageRow?.chars_count || 0;

  // 查询用户 plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const isPro = profile?.plan === "pro";

  if (!isPro && currentUsage >= FREE_LIMIT) {
    return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 429 });
  }

  try {
    // Step 1: Transcribe via Groq Whisper
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/webm" }),
      "audio.webm"
    );
    formData.append("model", ASR_MODEL);
    if (language && language !== "auto") {
      formData.append("language", language);
    }

    const asrRes = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}` },
      body: formData,
    });
    const asrData = await asrRes.json();

    if (asrData.error) {
      return NextResponse.json({
        error: asrData.error.message || "ASR API error",
      });
    }

    const raw = asrData.text;
    if (!raw?.trim()) {
      return NextResponse.json({ error: "NO_SPEECH" });
    }

    // Step 2: Polish via Groq LLaMA
    const polishRes = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: "system",
            content: buildPolishPrompt(context || "general"),
          },
          { role: "user", content: raw },
        ],
        temperature: 0,
        max_tokens: 2048,
      }),
    });
    const polishData = await polishRes.json();
    const polished =
      polishData.choices?.[0]?.message?.content?.trim() || raw;

    // 修复2：异步更新用量到数据库（fire and forget）
    const newChars = polished.length;
    (async () => {
      try {
        if (usageRow) {
          await supabase
            .from("usage")
            .update({
              chars_count: currentUsage + newChars,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("week_start", weekStart);
        } else {
          await supabase.from("usage").insert({
            user_id: userId,
            chars_count: newChars,
            week_start: weekStart,
          });
        }
      } catch (e) {
        console.error("[process-audio] Usage update failed:", e);
      }
    })();

    return NextResponse.json({
      transcript: raw,
      polished,
      charCount: newChars,
      language: asrData.language || "auto",
      duration: asrData.duration || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[process-audio] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
