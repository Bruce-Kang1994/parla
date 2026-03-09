import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";
import { randomBytes } from "crypto";

// POST /api/invite/create — 生成邀请码
export async function POST(req: NextRequest) {
  const { user, supabase, error: authErr } = await getAuthUser(req);
  if (authErr) return authErr;

  // 检查今日已生成数量（日限 10 个）
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from("invite_codes")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user!.id)
    .gte("created_at", `${today}T00:00:00Z`);

  if ((count || 0) >= 10) {
    return NextResponse.json({ error: "今日邀请码生成数量已达上限（10个/天）" }, { status: 429 });
  }

  // 生成邀请码: MUR-INV-XXXXXX
  const code = `MUR-INV-${randomBytes(3).toString("hex").toUpperCase()}`;

  const { error } = await supabase.from("invite_codes").insert({
    code,
    creator_id: user!.id,
    bonus_chars: 5000,
  });

  if (error) {
    // 极小概率碰撞，重试
    const code2 = `MUR-INV-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
    await supabase.from("invite_codes").insert({
      code: code2,
      creator_id: user!.id,
      bonus_chars: 5000,
    });
    return NextResponse.json({ code: code2 });
  }

  return NextResponse.json({ code });
}
