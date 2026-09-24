import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getTransactionStatus,
  isPaidStatus,
  parseOrderId,
  verifySignatureKey,
} from "@/lib/midtrans";
import { PLANS } from "@/lib/plans";

export const maxDuration = 60;

/**
 * Midtrans payment notification handler.
 * - Verifies the signature before trusting anything.
 * - Re-checks the payment status via Midtrans' status API.
 * - Grants the plan on successful payment (settlement / accepted capture).
 * - Always answers 200 "ok" so Midtrans stops retrying.
 */
export async function POST(req: Request) {
  let notification: any;
  try {
    notification = await req.json();
  } catch {
    return NextResponse.json({ status: "ok" });
  }

  const orderId = notification?.order_id as string | undefined;
  if (!orderId) {
    return NextResponse.json({ status: "ok" });
  }

  if (!verifySignatureKey(notification)) {
    console.warn("[Midtrans] Invalid signature key for order:", orderId);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const parsed = parseOrderId(orderId);
  if (!parsed) {
    console.warn("[Midtrans] Unrecognized order_id format:", orderId);
    return NextResponse.json({ status: "ok" });
  }

  let status: string | undefined = notification.transaction_status;
  let fraud: string | null | undefined = notification.fraud_status;

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
    select: { id: true, plan: true, midtransOrderId: true },
  });

  if (!user) {
    console.warn("[Midtrans] User not found for order:", orderId);
    return NextResponse.json({ status: "ok" });
  }

  // Idempotency — don't reprocess the same order
  if (user.midtransOrderId === orderId) {
    return NextResponse.json({ status: "ok" });
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
        midtransPaymentType: notification.payment_type ?? null,
      },
    });

    console.log(
      `[Midtrans] User ${user.id} activated ${parsed.plan} until ${expiresAt.toISOString()} (order ${orderId}, ${notification.payment_type})`,
    );
  }

  return NextResponse.json({ status: "ok" });
}