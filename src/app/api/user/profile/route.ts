import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getWeekStartUTC } from "@/lib/supabase/auth-helper";

// GET /api/user/profile — 获取用户信息 + 订阅状态 + 本周用量
export async function GET(req: NextRequest) {
  const { user, supabase, error: authErr } = await getAuthUser(req);
  if (authErr) return authErr;

  // 获取 profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // 检查 Pro 是否过期
  let plan = profile.plan;
  if (plan === "pro" && profile.plan_expires_at) {
    if (new Date(profile.plan_expires_at) < new Date()) {
      plan = "free";
      await supabase
        .from("profiles")
        .update({ plan: "free", plan_expires_at: null, weekly_char_limit: 10000 })
        .eq("id", user!.id);
    }
  }

  // 获取本周用量 (UTC)
  const weekStart = getWeekStartUTC();
  const { data: usage } = await supabase
    .from("usage")
    .select("chars_count")
    .eq("user_id", user!.id)
    .eq("week_start", weekStart)
    .single();

  const weeklyLimit = plan === "pro" ? 999999999 : (profile.weekly_char_limit + profile.invite_bonus_chars);

  return NextResponse.json({
    id: user!.id,
    email: profile.email,
    plan,
    planExpiresAt: profile.plan_expires_at,
    weeklyCharLimit: weeklyLimit,
    usage: {
      count: usage?.chars_count || 0,
      weekStart,
    },
  });
}
