import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';
import {
	getTransactionStatus,
	isPaidStatus,
	parseOrderId,
	verifySignatureKey
} from '$lib/server/midtrans';
import { PLANS } from '$lib/server/plans';

// The AI/generate action may take up to 60s — allow the same headroom here so
// Midtrans retries don't overlap with slow verifications (Vercel / node).
export const config = { maxDuration: 60 };

/**
 * Midtrans payment notification handler.
 * - Verifies the signature before trusting anything.
 * - Re-checks the payment status via Midtrans' status API.
 * - Grants the plan on successful payment (settlement / accepted capture).
 * - Always answers 200 "ok" so Midtrans stops retrying.
 */
export const POST: RequestHandler = async ({ request }) => {
	let notification: Record<string, unknown>;
	try {
		notification = await request.json();
	} catch {
		return json({ status: 'ok' });
	}

	const orderId = notification?.order_id as string | undefined;
	if (!orderId) {
		return json({ status: 'ok' });
	}

	if (
		!verifySignatureKey(
			notification as Parameters<typeof verifySignatureKey>[0]
		)
	) {
		console.warn('[Midtrans] Invalid signature key for order:', orderId);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	const parsed = parseOrderId(orderId);
	if (!parsed) {
		console.warn('[Midtrans] Unrecognized order_id format:', orderId);
		return json({ status: 'ok' });
	}

	let status: string | undefined = notification.transaction_status as
		| string
		| undefined;
	let fraud: string | null | undefined = notification.fraud_status as
		| string
		| null
		| undefined;

	// Server-side confirmation before granting access
	if (isPaidStatus(status, fraud)) {
		const confirmed = await getTransactionStatus(orderId);
		if (confirmed?.transaction_status) {
			status = confirmed.transaction_status;
			fraud = confirmed.fraud_status ?? fraud;
		}
	}

	const user = await prisma.user.findUnique({
		where: { id: parsed.userId },
		select: { id: true, plan: true, midtransOrderId: true }
	});

	if (!user) {
		console.warn('[Midtrans] User not found for order:', orderId);
		return json({ status: 'ok' });
	}

	// Idempotency — don't reprocess the same order
	if (user.midtransOrderId === orderId) {
		return json({ status: 'ok' });
	}

	if (isPaidStatus(status, fraud)) {
		const validityMs = PLANS[parsed.plan].validityDays * 24 * 60 * 60 * 1000;
		const expiresAt = new Date(Date.now() + validityMs);

		await prisma.user.update({
			where: { id: user.id },
			data: {
				plan: parsed.plan,
				planExpiresAt: expiresAt,
				midtransOrderId: orderId,
				midtransPaymentType: (notification.payment_type as string | null) ?? null
			}
		});

		console.log(
			`[Midtrans] User ${user.id} activated ${parsed.plan} until ${expiresAt.toISOString()} (order ${orderId}, ${String(notification.payment_type)})`
		);
	}

	return json({ status: 'ok' });
};