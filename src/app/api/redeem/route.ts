import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";

const DURATION_MAP: Record<string, number> = {
  pro_1m: 30,
  pro_3m: 90,
  pro_6m: 180,
  pro_1y: 365,
};

// POST /api/redeem — 使用兑换码（兑换 Pro 时长）
export async function POST(req: NextRequest) {
  const { user, supabase, error: authErr } = await getAuthUser(req);
  if (authErr) return authErr;

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "请提供兑换码" }, { status: 400 });
  }

  // 查找兑换码
  const { data: redeem, error: findErr } = await supabase
    .from("redeem_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (findErr || !redeem) {
    return NextResponse.json({ error: "兑换码不存在" }, { status: 404 });
  }

  if (redeem.redeemed_at) {
    return NextResponse.json({ error: "该兑换码已被使用" }, { status: 400 });
  }

  const days = DURATION_MAP[redeem.type];
  if (!days) {
    return NextResponse.json({ error: "无效的兑换码类型" }, { status: 400 });
  }

  // 计算到期时间（如果已是 Pro，从当前到期时间延长）
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", user!.id)
    .single();

  let expiresAt: Date;
  if (profile?.plan === "pro" && profile.plan_expires_at) {
    const currentExpiry = new Date(profile.plan_expires_at);
    if (currentExpiry > new Date()) {
      expiresAt = new Date(currentExpiry.getTime() + days * 86400000);
    } else {
      expiresAt = new Date(Date.now() + days * 86400000);
    }
  } else {
    expiresAt = new Date(Date.now() + days * 86400000);
  }

  // 标记兑换码已用
  await supabase
    .from("redeem_codes")
    .update({
      redeemer_id: user!.id,
      redeemed_at: new Date().toISOString(),
    })
    .eq("code", redeem.code);

  // 升级用户为 Pro
  await supabase
    .from("profiles")
    .update({
      plan: "pro",
      plan_expires_at: expiresAt.toISOString(),
      weekly_char_limit: 999999999,
    })
    .eq("id", user!.id);

  const durationLabel: Record<string, string> = {
    pro_1m: "1 个月",
    pro_3m: "3 个月",
    pro_6m: "6 个月",
    pro_1y: "1 年",
  };

  return NextResponse.json({
    success: true,
    message: `兑换成功！已获得 ${durationLabel[redeem.type]} Pro 会员`,
    plan: "pro",
    expiresAt: expiresAt.toISOString(),
  });
}
