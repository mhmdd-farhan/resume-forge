import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroyCurrentSession, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroyCurrentSession();
  } catch (err: any) {
    console.error("[auth] signout error:", err?.message || err);
  }
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ success: true });
}