import crypto from "crypto";
import { PLANS, type PaidPlanType } from "./plans";

// ---------------------------------------------------------------------------
// Midtrans configuration
// ---------------------------------------------------------------------------

export const MIDTRANS_ENV =
  process.env.MIDTRANS_ENV === "production" ? "production" : "sandbox";
export const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
export const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? "";

const SNAP_BASE =
  MIDTRANS_ENV === "production"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
const API_BASE =
  MIDTRANS_ENV === "production"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";

export const MIDTRANS_SNAP_URL = `${SNAP_BASE}/snap/v1/transactions`;

// ---------------------------------------------------------------------------
// Order ID helpers
// ---------------------------------------------------------------------------

/**
 * Format: `<plan>-<userId>-<epochMs>` (kept under Midtrans' 50-char limit).
 * Plan & user are recoverable from the order id inside the webhook, so we
 * don't need Midtrans metadata storage to resolve who paid.
 */
export function buildOrderId(plan: PaidPlanType, userId: string): string {
  return `${plan}-${userId}-${Date.now()}`;
}

export function parseOrderId(
  orderId: string,
): { plan: PaidPlanType; userId: string } | null {
  // Some channels may prefix order_id (e.g. "GOPAY-<order>"); match from the end.
  const m = orderId.match(/(starter|premium|annual)-([A-Za-z0-9]+)-(\d+)$/);
  if (!m) return null;
  return { plan: m[1] as PaidPlanType, userId: m[2] };
}

// ---------------------------------------------------------------------------
// Snap transaction (checkout)
// ---------------------------------------------------------------------------

export interface SnapCustomer {
  first_name?: string;
  email?: string;
  phone?: string;
}

export async function createSnapTransaction(params: {
  orderId: string;
  plan: PaidPlanType;
  customer?: SnapCustomer;
  appUrl: string;
}): Promise<{ token: string; redirectUrl: string }> {
  if (!MIDTRANS_SERVER_KEY) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured.");
  }

  const plan = PLANS[params.plan];

  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: plan.price,
    },
    item_details: [
      {
        id: params.plan,
        price: plan.price,
        quantity: 1,
        name: `ResumeForge ${plan.displayName} (${plan.validityDays} hari)`,
      },
    ],
    customer_details: {
      first_name: params.customer?.first_name?.slice(0, 20) ?? "Customer",
      email: params.customer?.email ?? "",
      phone: params.customer?.phone ?? "",
    },
    credit_card: { secure: true },
    expiry: {
      start_time: new Date().toISOString(),
      unit: "days",
      duration: 1,
    },
    notification_url: `${params.appUrl}/api/webhook/midtrans`,
  };

  const res = await fetch(MIDTRANS_SNAP_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth(MIDTRANS_SERVER_KEY, "")}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirect_url) {
    throw new Error(
      (data as any).status_message ||
        `Midtrans Snap request failed (HTTP ${res.status}).`,
    );
  }

  return {
    token: (data as any).token as string,
    redirectUrl: (data as any).redirect_url as string,
  };
}

// ---------------------------------------------------------------------------
// Notification (webhook) verification
// ---------------------------------------------------------------------------

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
}

/**
 * Signature verification per Midtrans docs:
 * sha512(order_id + status_code + gross_amount + server_key)
 */
export function verifySignatureKey(
  notification: Pick<
    MidtransNotification,
    "order_id" | "status_code" | "gross_amount" | "signature_key"
  >,
): boolean {
  const payload =
    `${notification.order_id}${notification.status_code}` +
    `${notification.gross_amount}${MIDTRANS_SERVER_KEY}`;
  const hash = crypto.createHash("sha512").update(payload).digest("hex");
  return hash === notification.signature_key;
}

/** A payment counts as successful when it settled (all channels) or was captured with accepted fraud check (credit card). */
export function isPaidStatus(
  transactionStatus: string | undefined | null,
  fraudStatus?: string | null,
): boolean {
  if (transactionStatus === "settlement") return true;
  if (
    transactionStatus === "capture" &&
    (fraudStatus === "accept" || !fraudStatus)
  ) {
    return true;
  }
  return false;
}

/**
 * Double-check the payment against Midtrans' status API before granting access
 * (recommended by Midtrans to guard against forged notifications).
 */
export async function getTransactionStatus(orderId: string): Promise<{
  transaction_status?: string;
  fraud_status?: string;
  status_code?: string;
} | null> {
  try {
    const res = await fetch(
      `${API_BASE}/v2/${encodeURIComponent(orderId)}/status`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth(MIDTRANS_SERVER_KEY, "")}`,
        },
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function basicAuth(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`).toString("base64");
}