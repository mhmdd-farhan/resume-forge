import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  buildOrderId,
  createSnapTransaction,
  MIDTRANS_SERVER_KEY,
} from "@/lib/midtrans";
import type { PaidPlanType } from "@/lib/plans";

const VALID_PLANS: Record<string, PaidPlanType> = {
  starter: "starter",
  premium: "premium",
  annual: "annual",
};

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const planType = VALID_PLANS[body.planType as string];

    if (!planType) {
      return NextResponse.json({ error: "Invalid plan type." }, { status: 400 });
    }

    if (!MIDTRANS_SERVER_KEY) {
      return NextResponse.json(
        { error: "Midtrans server key is not configured." },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_APP_URL (or NEXT_PUBLIC_APP_URL) is not configured." },
        { status: 500 },
      );
    }

    const orderId = buildOrderId(planType, currentUser.id);

    const { redirectUrl, token } = await createSnapTransaction({
      orderId,
      plan: planType,
      customer: {
        first_name: currentUser.name || undefined,
        email: currentUser.email || undefined,
      },
      appUrl,
    });

    return NextResponse.json({ url: redirectUrl, token, orderId });
  } catch (err: any) {
    console.error("Error creating Midtrans checkout session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session." },
      { status: 500 },
    );
  }
}