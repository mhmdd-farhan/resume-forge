import { NextResponse } from "next/server";

// Diagnostic endpoint: reports whether each important env var is present and
// non-empty at RUNTIME — without revealing any values.
// Useful for debugging deploy-time vs runtime env mismatches (e.g. Vercel scope,
// empty-string vars, stale deployment). Remove after setup if not needed.

export const dynamic = "force-dynamic";

type VarStatus = "ok" | "empty" | "missing";

function status(name: string): VarStatus {
  const v = process.env[name];
  if (v === undefined) return "missing";
  if (v === "") return "empty";
  return "ok";
}

const VARS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "MIDTRANS_ENV",
  "MIDTRANS_SERVER_KEY",
  "MIDTRANS_CLIENT_KEY",
  "N8N_WEBHOOK_URL",
  "N8N_BASIC_AUTH",
] as const;

export async function GET() {
  const vars: Record<string, VarStatus> = {};
  for (const name of VARS) {
    vars[name] = status(name);
  }
  const allOk = Object.values(vars).every((s) => s === "ok");
  return NextResponse.json({ ok: allOk, vars });
}