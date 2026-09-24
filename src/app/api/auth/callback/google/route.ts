import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForTokens,
  fetchGoogleProfile,
  getGoogleConfig,
} from "@/lib/auth";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

export const dynamic = "force-dynamic";

function clearOAuthCookies() {
  const store = cookies();
  store.delete("rf_oauth_state");
  store.delete("rf_oauth_verifier");
  store.delete("rf_oauth_cb");
}

function safeCallbackUrl(value: string | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

// Custom Google OAuth — step 2: exchange the code for tokens, load the
// profile, upsert the user + Google account link, then create a session.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("rf_oauth_state")?.value;
  const verifier = cookies().get("rf_oauth_verifier")?.value;
  const callbackUrl = safeCallbackUrl(cookies().get("rf_oauth_cb")?.value);

  // The state/PKCE cookies are one-time use — always clear them.
  clearOAuthCookies();

  if (error || !code || !state || !storedState || !verifier || state !== storedState) {
    return NextResponse.redirect(new URL("/?error=oauth", origin));
  }

  const { clientId, clientSecret } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?error=oauth", origin));
  }
  const redirectUri = `${origin}/api/auth/callback/google`;

  let profile;
  try {
    const { accessToken } = await exchangeCodeForTokens({
      clientId,
      clientSecret,
      code,
      codeVerifier: verifier,
      redirectUri,
    });
    profile = await fetchGoogleProfile(accessToken);
  } catch (err: any) {
    console.error("[oauth] token/profile exchange failed:", err?.message || err);
    return NextResponse.redirect(new URL("/?error=oauth", origin));
  }

  try {
    // Reuse the user when the Google account is already linked.
    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: profile.id,
        },
      },
      select: { userId: true },
    });

    let userId: string;
    if (existingAccount) {
      userId = existingAccount.userId;
    } else {
      const userByEmail = await prisma.user.findUnique({
        where: { email: profile.email },
        select: { id: true },
      });

      if (userByEmail) {
        userId = userByEmail.id;
        await prisma.account.create({
          data: {
            userId,
            type: "oauth",
            provider: "google",
            providerAccountId: profile.id,
          },
        });
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name ?? null,
            image: profile.picture ?? null,
            emailVerified: new Date(),
          },
        });
        userId = newUser.id;
        await prisma.account.create({
          data: {
            userId,
            type: "oauth",
            provider: "google",
            providerAccountId: profile.id,
          },
        });
      }
    }

    // One active session per user (simple, easy to reason about).
    await prisma.session.deleteMany({ where: { userId } });

    const sessionToken = await createSessionToken(userId);
    cookies().set(SESSION_COOKIE, sessionToken, sessionCookieOptions());

    return NextResponse.redirect(new URL(callbackUrl, origin));
  } catch (err: any) {
    console.error("[oauth] session creation failed:", err?.message || err);
    return NextResponse.redirect(new URL("/?error=oauth", origin));
  }
}