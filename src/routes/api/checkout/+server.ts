import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUser } from '$lib/server/session';
import { buildOrderId, createSnapTransaction, MIDTRANS_SERVER_KEY } from '$lib/server/midtrans';
import { CONFIGURED_APP_URL } from '$lib/server/config';
import type { PaidPlanType } from '$lib/server/plans';

const VALID_PLANS: Record<string, PaidPlanType> = {
	starter: 'starter',
	premium: 'premium',
	annual: 'annual'
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const currentUser = await getCurrentUser(cookies);
		if (!currentUser) {
			return json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
		}

		const body = await request.json().catch(() => ({}));
		const planType = VALID_PLANS[body.planType as string];

		if (!planType) {
			return json({ error: 'Invalid plan type.' }, { status: 400 });
		}

		if (!MIDTRANS_SERVER_KEY) {
			return json(
				{ error: 'Midtrans server key is not configured.' },
				{ status: 500 }
			);
		}

		// The notification_url MUST be a real public URL — never a placeholder.
		const appUrl = CONFIGURED_APP_URL;
		if (!appUrl) {
			return json(
				{ error: 'NEXT_APP_URL (or NEXT_PUBLIC_APP_URL) is not configured.' },
				{ status: 500 }
			);
		}

		const orderId = buildOrderId(planType, currentUser.id);

		const { redirectUrl, token } = await createSnapTransaction({
			orderId,
			plan: planType,
			customer: {
				first_name: currentUser.name || undefined,
				email: currentUser.email || undefined
			},
			appUrl
		});

		return json({ url: redirectUrl, token, orderId });
	} catch (err) {
		console.error('Error creating Midtrans checkout session:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to create checkout session.' },
			{ status: 500 }
		);
	}
};