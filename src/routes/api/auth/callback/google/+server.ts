import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import { exchangeCodeForTokens, fetchGoogleProfile, getGoogleConfig } from '$lib/server/auth';
import {
	createSessionToken,
	SESSION_COOKIE,
	sessionCookieOptions
} from '$lib/server/session';

// Custom Google OAuth — step 2: exchange the code for tokens, load the
// profile, upsert the user + Google account link, then create a session.
// Cookie names & redirect contract are identical to legacy next-auth, so no
// Google Cloud Console change is required.

function safeCallbackUrl(value: string | undefined): string {
	if (value && value.startsWith('/') && !value.startsWith('//')) return value;
	return '/dashboard';
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const origin = url.origin;

	const error = url.searchParams.get('error');
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('rf_oauth_state');
	const verifier = cookies.get('rf_oauth_verifier');
	const callbackUrl = safeCallbackUrl(cookies.get('rf_oauth_cb'));

	// The state/PKCE cookies are one-time use — always clear them.
	cookies.delete('rf_oauth_state', { path: '/' });
	cookies.delete('rf_oauth_verifier', { path: '/' });
	cookies.delete('rf_oauth_cb', { path: '/' });

	if (error || !code || !state || !storedState || !verifier || state !== storedState) {
		redirect(302, `${origin}/?error=oauth`);
	}

	const { clientId, clientSecret } = getGoogleConfig();
	if (!clientId || !clientSecret) {
		redirect(302, `${origin}/?error=oauth`);
	}
	const redirectUri = `${origin}/api/auth/callback/google`;

	let profile;
	try {
		const { accessToken } = await exchangeCodeForTokens({
			clientId,
			clientSecret,
			code,
			codeVerifier: verifier,
			redirectUri
		});
		profile = await fetchGoogleProfile(accessToken);
	} catch (err) {
		console.error('[oauth] token/profile exchange failed:', err instanceof Error ? err.message : err);
		redirect(302, `${origin}/?error=oauth`);
	}

	try {
		// Reuse the user when the Google account is already linked.
		const existingAccount = await prisma.account.findUnique({
			where: {
				provider_providerAccountId: {
					provider: 'google',
					providerAccountId: profile.id
				}
			},
			select: { userId: true }
		});

		let userId: string;
		if (existingAccount) {
			userId = existingAccount.userId;
		} else {
			const userByEmail = await prisma.user.findUnique({
				where: { email: profile.email },
				select: { id: true }
			});

			if (userByEmail) {
				userId = userByEmail.id;
				await prisma.account.create({
					data: {
						userId,
						type: 'oauth',
						provider: 'google',
						providerAccountId: profile.id
					}
				});
			} else {
				const newUser = await prisma.user.create({
					data: {
						email: profile.email,
						name: profile.name ?? null,
						image: profile.picture ?? null,
						emailVerified: new Date()
					}
				});
				userId = newUser.id;
				await prisma.account.create({
					data: {
						userId,
						type: 'oauth',
						provider: 'google',
						providerAccountId: profile.id
					}
				});
			}
		}

		// One active session per user (simple, easy to reason about).
		await prisma.session.deleteMany({ where: { userId } });

		const sessionToken = await createSessionToken(userId);
		cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());

		redirect(302, new URL(callbackUrl, origin).toString());
	} catch (err) {
		console.error('[oauth] session creation failed:', err instanceof Error ? err.message : err);
		redirect(302, `${origin}/?error=oauth`);
	}
};