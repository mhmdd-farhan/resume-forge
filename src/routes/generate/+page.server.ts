import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The standalone /generate page no longer exists — generation lives in the
// /dashboard Generate tab. Keep the old URL working with a server-side
// redirect (the old Next.js page did an SPA router.push('/dashboard')).
export const load: PageServerLoad = () => {
	redirect(303, '/dashboard');
};