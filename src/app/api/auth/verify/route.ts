import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/auth-helper";

// POST /api/auth/verify — 验证 OTP 码，返回 session
export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();
    if (!email || !token) {
      return NextResponse.json({ error: "请提供邮箱和验证码" }, { status: 400 });
    }

    const { supabase, error: svcErr } = getSupabase();
    if (svcErr) return svcErr;

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });

    if (error) {
      return NextResponse.json({ error: "验证码无效或已过期" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    });
  } catch (e) {
    console.error("[auth/verify]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
