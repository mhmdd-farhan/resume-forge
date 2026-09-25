import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getCurrentUser } from '$lib/server/session';
import { getActivePlan } from '$lib/server/plans';
import { generateResume } from '$lib/server/resume';
import { prisma } from '$lib/server/prisma';

// The generate action calls the n8n AI webhook — allow up to 60s on platforms
// that respect this (Vercel / adapter-node).
export const config = { maxDuration: 60 };

const FREE_LIMIT = 3;
const STARTER_DAILY_LIMIT = 4;

export const load: PageServerLoad = async ({ cookies }) => {
	const user = await getCurrentUser(cookies);
	if (!user) {
		redirect(302, `/api/auth/google?callbackUrl=${encodeURIComponent('/dashboard')}`);
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: {
			plan: true,
			planExpiresAt: true,
			resumesGenerated: true,
			dailyResumesGenerated: true,
			lastGenerationDate: true
		}
	});

	if (!dbUser) {
		redirect(302, `/api/auth/google?callbackUrl=${encodeURIComponent('/dashboard')}`);
	}

	const { plan, active, expiresAt } = getActivePlan({
		plan: dbUser.plan,
		planExpiresAt: dbUser.planExpiresAt
	});

	const isPremium = plan === 'premium' || plan === 'annual';
	const isStarter = plan === 'starter';

	const today = new Date().toISOString().slice(0, 10);
	const isNewDay = dbUser.lastGenerationDate !== today;
	const dailyUsed = isNewDay ? 0 : dbUser.dailyResumesGenerated;

	const remaining = isPremium
		? null
		: isStarter
			? Math.max(0, STARTER_DAILY_LIMIT - dailyUsed)
			: Math.max(0, FREE_LIMIT - dbUser.resumesGenerated);

	return {
		dashboardData: {
			name: user.name ?? '',
			email: user.email ?? '',
			image: user.image ?? '',
			plan,
			planExpiresAt: expiresAt?.toISOString() ?? null,
			resumesGenerated: dbUser.resumesGenerated,
			dailyUsed,
			remaining,
			limitPeriod: isPremium ? null : isStarter ? 'daily' : 'total',
			isPremium,
			isStarter,
			hasSubscription: active
		}
	};
};

export const actions: Actions = {
	generate: async ({ request, cookies }) => {
		const formData = await request.formData();
		const result = await generateResume(formData, cookies);
		if (!result.success) {
			return fail(400, { success: false, error: result.error });
		}
		return { success: true, data: result.data };
	},

	cancelSubscription: async ({ cookies }) => {
		try {
			const user = await getCurrentUser(cookies);
			if (!user) {
				return fail(401, { success: false, error: 'Unauthorized' });
			}

			const dbUser = await prisma.user.findUnique({
				where: { id: user.id },
				select: { plan: true, planExpiresAt: true }
			});

			if (!dbUser) {
				return fail(404, { success: false, error: 'User not found' });
			}

			const active =
				dbUser.plan !== 'free' &&
				dbUser.planExpiresAt !== null &&
				dbUser.planExpiresAt.getTime() > Date.now();

			if (!active) {
				return fail(400, { success: false, error: 'No active subscription to cancel' });
			}

			// Midtrans is a one-time payment (no recurring billing to revoke) —
			// cancellation only demotes the local plan.
			await prisma.user.update({
				where: { id: user.id },
				data: { plan: 'free', planExpiresAt: null }
			});

			return { success: true, message: 'Subscription cancelled successfully' };
		} catch (err) {
			console.error('Error cancelling subscription:', err);
			return fail(500, {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to cancel subscription'
			});
		}
	}
};