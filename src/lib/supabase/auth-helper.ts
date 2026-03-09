import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "./admin";

const SERVICE_UNAVAILABLE = NextResponse.json(
  { error: "服务未配置，请检查 Supabase 环境变量" },
  { status: 503 }
);

/**
 * Get authenticated user from Bearer token.
 * Returns { user, supabase } on success, or { error: NextResponse } on failure.
 */
export async function getAuthUser(req: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return { user: null, supabase: null, error: SERVICE_UNAVAILABLE };
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "未登录" }, { status: 401 }),
    };
  }

  const token = auth.slice(7);
  const { data } = await supabase.auth.getUser(token);
  if (!data.user) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "登录已过期" }, { status: 401 }),
    };
  }

  return { user: data.user, supabase, error: null };
}

/** Check Supabase is configured, return client or 503 response */
export function getSupabase() {
  const supabase = createAdminClient();
  if (!supabase) {
    return { supabase: null, error: SERVICE_UNAVAILABLE };
  }
  return { supabase, error: null };
}

/** UTC-based week start (Monday) */
export function getWeekStartUTC(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff)
  );
  return monday.toISOString().slice(0, 10);
}
