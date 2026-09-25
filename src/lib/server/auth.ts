import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';

// ─── Custom Google OAuth (no next-auth) ────────────────────────────────────
// The redirect URI (`/api/auth/callback/google`) is kept identical to the
// legacy next-auth callback so no Google Cloud Console change is required.

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export interface GoogleProfile {
	id: string;
	email: string;
	verified_email?: boolean;
	name?: string;
	picture?: string;
	hd?: string;
}

export function getGoogleConfig() {
	return {
		clientId: env.GOOGLE_CLIENT_ID ?? '',
		clientSecret: env.GOOGLE_CLIENT_SECRET ?? ''
	};
}

export function randomHex(bytes: number): string {
	return crypto.randomBytes(bytes).toString('hex');
}

/** Generate a PKCE (S256) code_verifier / code_challenge pair. */
export function pkcePair() {
	const verifier = crypto.randomBytes(32).toString('base64url');
	const challenge = crypto
		.createHash('sha256')
		.update(verifier)
		.digest('base64url');
	return { verifier, challenge };
}

export function buildGoogleAuthUrl(opts: {
	clientId: string;
	redirectUri: string;
	state: string;
	codeChallenge: string;
}): string {
	const params = new URLSearchParams({
		client_id: opts.clientId,
		redirect_uri: opts.redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		state: opts.state,
		code_challenge: opts.codeChallenge,
		code_challenge_method: 'S256'
	});
	return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(opts: {
	clientId: string;
	clientSecret: string;
	code: string;
	codeVerifier: string;
	redirectUri: string;
}): Promise<{ accessToken: string }> {
	const res = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: opts.clientId,
			client_secret: opts.clientSecret,
			code: opts.code,
			code_verifier: opts.codeVerifier,
			redirect_uri: opts.redirectUri,
			grant_type: 'authorization_code'
		})
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok || !data.access_token) {
		throw new Error(
			`Token exchange failed: ${data.error_description || data.error || `HTTP ${res.status}`}`
		);
	}
	return { accessToken: data.access_token };
}

export async function fetchGoogleProfile(
	accessToken: string
): Promise<GoogleProfile> {
	const res = await fetch(GOOGLE_USERINFO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` },
		cache: 'no-store'
	});
	const profile = await res.json().catch(() => ({}));
	if (!res.ok || !profile.id || !profile.email) {
		throw new Error('Failed to fetch Google profile');
	}
	return profile;
}