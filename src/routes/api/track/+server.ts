import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';

// Fire-and-forget analytics ingest — never fail the client.
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const { type, name } = body as { type?: unknown; name?: unknown };
		if (type === 'pageview' && typeof name === 'string') {
			await prisma.pageView.create({ data: { path: name } });
		} else if (type === 'click' && typeof name === 'string') {
			await prisma.clickEvent.create({ data: { event: name } });
		}
	} catch {
		// fire-and-forget — never fail the client
	}
	return json({ ok: true });
};