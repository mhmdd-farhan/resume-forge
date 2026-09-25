import type { RequestHandler } from './$types';
import { APP_URL } from '$lib/server/config';

export const GET: RequestHandler = () => {
	const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/

Sitemap: ${APP_URL}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400, s-maxage=86400'
		}
	});
};