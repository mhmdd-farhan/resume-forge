import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildGoogleAuthUrl,
  getGoogleConfig,
  pkcePair,
  randomHex,
} from "@/lib/auth";
import { sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

// Custom Google OAuth — step 1: redirect to Google's consent screen.
// The redirect URI matches the one already registered in Google Cloud Console.
export async function GET(req: Request) {
  const { clientId, clientSecret } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/callback/google`;
  const rawCallback = url.searchParams.get("callbackUrl") || "/dashboard";
  // Only allow same-origin relative redirect targets.
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard";

  const state = randomHex(16);
  const { verifier, challenge } = pkcePair();

  const store = cookies();
  const oauthCookie = { ...sessionCookieOptions(600) }; // 10 minutes
  store.set("rf_oauth_state", state, oauthCookie);
  store.set("rf_oauth_verifier", verifier, oauthCookie);
  store.set("rf_oauth_cb", callbackUrl, oauthCookie);

  return NextResponse.redirect(
    buildGoogleAuthUrl({ clientId, redirectUri, state, codeChallenge: challenge }),
  );
}