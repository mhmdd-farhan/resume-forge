export type PaidPlanType = "starter" | "premium" | "annual";
export type PlanType = "free" | PaidPlanType;

import { DEFAULT_PRICES } from "@/lib/pricing";

export interface PlanConfig {
  /** Price in IDR (configurable via env) */
  price: number;
  /** Validity period in days */
  validityDays: number;
  displayName: string;
}

/**
 * Server-side price reader. Non-public MIDTRANS_*_PRICE takes precedence
 * (existing config stays authoritative for charging); falls back to the
 * NEXT_PUBLIC_MIDTRANS_*_PRICE (same values the landing page displays),
 * then to the built-in default.
 */
function envPrice(plan: PaidPlanType, fallback: number): number {
  const key = `MIDTRANS_${plan.toUpperCase()}_PRICE`;
  const publicKey = `NEXT_PUBLIC_${key}`;
  const raw = process.env[key] ?? process.env[publicKey];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const PLANS: Record<PaidPlanType, PlanConfig> = {
  starter: {
    price: envPrice("starter", DEFAULT_PRICES.starter),
    validityDays: 30,
    displayName: "Starter",
  },
  premium: {
    price: envPrice("premium", DEFAULT_PRICES.premium),
    validityDays: 30,
    displayName: "Premium",
  },
  annual: {
    price: envPrice("annual", DEFAULT_PRICES.annual),
    validityDays: 365,
    displayName: "Annual",
  },
};

export function isPaidPlan(plan: string): plan is PaidPlanType {
  return plan === "starter" || plan === "premium" || plan === "annual";
}

/**
 * Resolves the effective plan & active status from the DB row.
 * A paid plan is only "active" while planExpiresAt is in the future.
 */
export function getActivePlan(input: {
  plan: string;
  planExpiresAt: Date | string | null;
}): { plan: PlanType; active: boolean; expiresAt: Date | null } {
  const expiresAt = input.planExpiresAt ? new Date(input.planExpiresAt) : null;
  const active =
    isPaidPlan(input.plan) &&
    expiresAt !== null &&
    expiresAt.getTime() > Date.now();

  return {
    plan: active ? input.plan : "free",
    active,
    expiresAt: active ? expiresAt : null,
  };
}