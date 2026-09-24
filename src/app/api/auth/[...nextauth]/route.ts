import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

// Resolve Google OAuth credentials explicitly so a missing/empty value is
// caught with a clear log instead of reaching the OAuth client as "" (which
// surfaces as the cryptic "client_id is required" at sign-in time).
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.OAUTH_CLIENT_ID;
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET || process.env.OAUTH_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.error(
    `[next-auth] Google OAuth is NOT configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET ` +
      `(scope: Production) in Vercel -> Project -> Settings -> Environment Variables, then redeploy. ` +
      `Current: GOOGLE_CLIENT_ID=${googleClientId ? "set" : "MISSING/EMPTY"}, ` +
      `GOOGLE_CLIENT_SECRET=${googleClientSecret ? "set" : "MISSING/EMPTY"}`
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "__Secure-next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan || "free";
      } else {
        // Query the database to get the latest plan on subsequent requests
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { plan: true },
        });
        if (dbUser) {
          token.plan = dbUser.plan;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
