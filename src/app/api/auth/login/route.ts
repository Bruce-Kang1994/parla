import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/auth-helper";

// POST /api/auth/login — 发送邮箱验证码（OTP）
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "请提供邮箱地址" }, { status: 400 });
    }

    const { supabase, error: svcErr } = getSupabase();
    if (svcErr) return svcErr;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error("[auth/login] OTP error:", error.message);
      return NextResponse.json({ error: "发送验证码失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
