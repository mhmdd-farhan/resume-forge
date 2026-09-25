import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { destroyCurrentSession, SESSION_COOKIE, sessionCookieOptions } from '$lib/server/session';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		await destroyCurrentSession(cookies);
	} catch (err) {
		console.error('[auth] signout error:', err instanceof Error ? err.message : err);
	}
	cookies.delete(SESSION_COOKIE, sessionCookieOptions());
	return json({ success: true });
};