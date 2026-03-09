import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getWeekStartUTC } from "@/lib/supabase/auth-helper";

// POST /api/user/usage — 上报用量（每次听写完成后调用）
export async function POST(req: NextRequest) {
  const { user, supabase, error: authErr } = await getAuthUser(req);
  if (authErr) return authErr;

  const { chars } = await req.json();
  if (!chars || typeof chars !== "number" || chars <= 0) {
    return NextResponse.json({ error: "无效的字数" }, { status: 400 });
  }

  const weekStart = getWeekStartUTC();

  // Upsert: 如果本周记录存在则累加，否则新建
  const { data: existing } = await supabase
    .from("usage")
    .select("id, chars_count")
    .eq("user_id", user!.id)
    .eq("week_start", weekStart)
    .single();

  if (existing) {
    const newCount = existing.chars_count + chars;
    await supabase
      .from("usage")
      .update({ chars_count: newCount, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    return NextResponse.json({ count: newCount, weekStart });
  } else {
    await supabase.from("usage").insert({
      user_id: user!.id,
      chars_count: chars,
      week_start: weekStart,
    });

    return NextResponse.json({ count: chars, weekStart });
  }
}
