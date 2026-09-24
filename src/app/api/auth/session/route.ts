import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// Lightweight session lookup for the client (replaces next-auth's session).
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    console.error("[auth] session lookup failed:", err);
    return NextResponse.json({ user: null });
  }
}