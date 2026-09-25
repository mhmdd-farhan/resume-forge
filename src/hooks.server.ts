import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// ─── Admin basic auth guard ────────────────────────────────────────────────
// Kept identical to the old Next.js middleware contract:
//   - ADMIN_USERNAME / ADMIN_PASSWORD unset -> /admin responds 500 (closed)
//   - wrong / missing Authorization header -> 401 + WWW-Authenticate
export const handle: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url);

	if (url.pathname.startsWith('/admin')) {
		const username = env.ADMIN_USERNAME;
		const password = env.ADMIN_PASSWORD;

		if (!username || !password) {
			return new Response('Admin credentials not configured', { status: 500 });
		}

		const authHeader = event.request.headers.get('authorization');
		const expected = 'Basic ' + btoa(`${username}:${password}`);

		if (authHeader !== expected) {
			return new Response('Unauthorized', {
				status: 401,
				headers: { 'WWW-Authenticate': 'Basic realm="ResumeForge Admin"' }
			});
		}
	}

	return resolve(event);
};