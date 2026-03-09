import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth-helper";

// POST /api/invite/redeem — 使用邀请码
export async function POST(req: NextRequest) {
  const { user, supabase, error: authErr } = await getAuthUser(req);
  if (authErr) return authErr;

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "请提供邀请码" }, { status: 400 });
  }

  // 查找邀请码
  const { data: invite, error: findErr } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (findErr || !invite) {
    return NextResponse.json({ error: "邀请码不存在" }, { status: 404 });
  }

  if (invite.redeemed_at) {
    return NextResponse.json({ error: "该邀请码已被使用" }, { status: 400 });
  }

  if (invite.creator_id === user!.id) {
    return NextResponse.json({ error: "不能使用自己生成的邀请码" }, { status: 400 });
  }

  // 兑换：标记邀请码已用
  await supabase
    .from("invite_codes")
    .update({
      redeemer_id: user!.id,
      redeemed_at: new Date().toISOString(),
    })
    .eq("code", invite.code);

  // 推荐人获得 5000 字/周额外额度（累计上限 50000）
  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("invite_bonus_chars")
    .eq("id", invite.creator_id)
    .single();

  const currentBonus = creatorProfile?.invite_bonus_chars || 0;
  if (currentBonus < 50000) {
    const newBonus = Math.min(currentBonus + invite.bonus_chars, 50000);
    await supabase
      .from("profiles")
      .update({ invite_bonus_chars: newBonus })
      .eq("id", invite.creator_id);
  }

  // 被推荐人首周翻倍（临时将 weekly_char_limit 设为 20000）
  await supabase
    .from("profiles")
    .update({ weekly_char_limit: 20000 })
    .eq("id", user!.id);

  return NextResponse.json({
    success: true,
    message: "邀请码兑换成功！本周额度翻倍至 20,000 字",
  });
}
