import { NextRequest, NextResponse } from "next/server";
import { getMockPolish } from "@/lib/mock";
import { buildPolishPrompt } from "@/lib/prompts";
import { execSync } from "child_process";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export async function POST(req: NextRequest) {
  try {
    const { raw, context = "general", tone = "professional", language = "auto" } = await req.json();

    if (!raw) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      const polished = getMockPolish(raw);
      return NextResponse.json({ polished });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const prompt = buildPolishPrompt({ context, tone, language });

    const payload = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: raw },
      ],
      temperature: 0,
      max_tokens: 2048,
    });

    // Use curl — Node.js 24 TLS fingerprint is blocked by Groq's WAF
    const result = execSync(
      `curl -s https://api.groq.com/openai/v1/chat/completions ` +
      `-H "Content-Type: application/json" ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-d ${shellEscape(payload)}`,
      { timeout: 30000 }
    ).toString();

    const data = JSON.parse(result);

    if (data.error) {
      console.error("[polish] Groq error:", data.error);
      return NextResponse.json({ error: data.error.message || "LLM error" }, { status: 400 });
    }

    const polished = data.choices[0]?.message?.content?.trim() || raw;
    console.log("[polish] RAW INPUT:", raw);
    console.log("[polish] POLISHED OUTPUT:", polished);
    return NextResponse.json({ polished });
  } catch (err) {
    console.error("[polish] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function shellEscape(str: string): string {
  return "'" + str.replace(/'/g, "'\\''") + "'";
}
