// ─── Price config shared server + client ────────────────────────────────────
// The landing page (client) shows prices from NEXT_PUBLIC_MIDTRANS_*_PRICE.
// The server's charge amount (src/lib/server/plans.ts) reads MIDTRANS_*_PRICE
// first, then falls back to the NEXT_PUBLIC_* values - set the NEXT_PUBLIC_*
// ones to match if you want display == charge.

import { env } from '$env/dynamic/public';

export type PricePlan = 'starter' | 'premium' | 'annual';

export const DEFAULT_PRICES: Record<PricePlan, number> = {
	starter: 15000,
	premium: 49000,
	annual: 399000
};

/** Price in IDR for a plan, from the NEXT_PUBLIC_* env (or default). */
export function priceForPlan(plan: PricePlan): number {
	const value =
		plan === 'starter'
			? env.NEXT_PUBLIC_MIDTRANS_STARTER_PRICE
			: plan === 'premium'
				? env.NEXT_PUBLIC_MIDTRANS_PREMIUM_PRICE
				: env.NEXT_PUBLIC_MIDTRANS_ANNUAL_PRICE;
	const parsed = value ? Number(value) : NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PRICES[plan];
}

/** "Rp49.000" style formatting (exact, id-ID thousands separators). */
export function formatPrice(price: number): string {
	return `Rp${price.toLocaleString('id-ID')}`;
}