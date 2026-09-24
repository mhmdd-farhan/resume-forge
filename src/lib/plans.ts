export type PaidPlanType = "starter" | "premium" | "annual";
export type PlanType = "free" | PaidPlanType;

export interface PlanConfig {
  /** Price in IDR (configurable via env) */
  price: number;
  /** Validity period in days */
  validityDays: number;
  displayName: string;
}

export const PLANS: Record<PaidPlanType, PlanConfig> = {
  starter: {
    price: Number(process.env.MIDTRANS_STARTER_PRICE ?? 15000),
    validityDays: 30,
    displayName: "Starter",
  },
  premium: {
    price: Number(process.env.MIDTRANS_PREMIUM_PRICE ?? 49000),
    validityDays: 30,
    displayName: "Premium",
  },
  annual: {
    price: Number(process.env.MIDTRANS_ANNUAL_PRICE ?? 399000),
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