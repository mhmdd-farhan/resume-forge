import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildGoogleAuthUrl, getGoogleConfig, pkcePair, randomHex } from '$lib/server/auth';
import { sessionCookieOptions } from '$lib/server/session';

// Custom Google OAuth — step 1: redirect to Google's consent screen.
// The redirect URI (/api/auth/callback/google) matches the one already
// registered in Google Cloud Console. Cookie names & the callback contract
// are identical to the legacy next-auth flow.
export const GET: RequestHandler = ({ url, cookies }) => {
	const { clientId, clientSecret } = getGoogleConfig();
	if (!clientId || !clientSecret) {
		return json(
			{
				error:
					'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
			},
			{ status: 500 }
		);
	}

	const redirectUri = `${url.origin}/api/auth/callback/google`;
	const rawCallback = url.searchParams.get('callbackUrl') || '/dashboard';
	// Only allow same-origin relative redirect targets.
	const callbackUrl =
		rawCallback.startsWith('/') && !rawCallback.startsWith('//')
			? rawCallback
			: '/dashboard';

	const state = randomHex(16);
	const { verifier, challenge } = pkcePair();

	const oauthCookie = sessionCookieOptions(600); // 10 minutes
	cookies.set('rf_oauth_state', state, oauthCookie);
	cookies.set('rf_oauth_verifier', verifier, oauthCookie);
	cookies.set('rf_oauth_cb', callbackUrl, oauthCookie);

	redirect(
		302,
		buildGoogleAuthUrl({ clientId, redirectUri, state, codeChallenge: challenge })
	);
};