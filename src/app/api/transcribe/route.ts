import { NextRequest, NextResponse } from "next/server";
import { getMockTranscription } from "@/lib/mock";
import { writeFile, unlink } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";
import { tmpdir } from "os";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export async function POST(req: NextRequest) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const result = getMockTranscription();
    return NextResponse.json(result);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  let tmpPath = "";

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Write to temp file
    const ext = audioFile.name?.split(".").pop() || "webm";
    tmpPath = join(tmpdir(), `parla_${Date.now()}.${ext}`);
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(tmpPath, buffer);

    console.log("[transcribe] File saved:", tmpPath, buffer.length, "bytes");

    // Use curl — Node.js 24 fetch has multipart issues with Groq API
    const result = execSync(
      `curl -s https://api.groq.com/openai/v1/audio/transcriptions ` +
      `-H "Authorization: Bearer ${apiKey}" ` +
      `-F "file=@${tmpPath}" ` +
      `-F "model=whisper-large-v3-turbo" ` +
      `-F "response_format=verbose_json"`,
      { timeout: 30000 }
    ).toString();

    const data = JSON.parse(result);

    if (data.error) {
      console.error("[transcribe] Groq error:", data.error);
      return NextResponse.json({ error: data.error.message || "Groq API error" }, { status: 400 });
    }

    console.log("[transcribe] FULL RAW TEXT:", data.text);

    return NextResponse.json({
      raw: data.text,
      polished: "",
      language: data.language || "auto",
      duration: data.duration || 0,
    });
  } catch (err) {
    console.error("[transcribe] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tmpPath) {
      unlink(tmpPath).catch(() => {});
    }
  }
}
