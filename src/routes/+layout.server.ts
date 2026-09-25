import type { LayoutServerLoad } from './$types';
import { APP_URL } from '$lib/server/config';
import { getCurrentUser } from '$lib/server/session';

// Root layout load — provides the signed-in user (AuthUser) and the public app
// URL to every page. Replaces the old /api/auth/session polling endpoint.
export const load: LayoutServerLoad = async ({ cookies }) => {
	const user = await getCurrentUser(cookies);

	return {
		appUrl: APP_URL,
		user: user
			? {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					plan: user.plan,
					planExpiresAt: user.planExpiresAt?.toISOString() ?? null
				}
			: null
	};
};