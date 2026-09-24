import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// ─── Custom session (opaque token stored in the Session table) ─────────────
// No JWT, no signing secret required — the token is a random value kept in the
// DB, so there is no NEXTAUTH_SECRET/AUTH_SECRET to misconfigure.

export const SESSION_COOKIE = "rf_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createSessionToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });
  return token;
}

/** Returns the signed-in user (full Prisma row) or null. */
export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expires.getTime() < Date.now()) {
    await prisma.session
      .delete({ where: { sessionToken: token } })
      .catch(() => {});
    return null;
  }
  return session.user;
}

export async function destroyCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session
    .delete({ where: { sessionToken: token } })
    .catch(() => {});
}