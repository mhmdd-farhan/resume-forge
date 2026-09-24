import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured." },
        { status: 500 },
      );
    }

    const user = session.user as any;
    const orderId = buildOrderId(planType, user.id as string);

    const { redirectUrl, token } = await createSnapTransaction({
      orderId,
      plan: planType,
      customer: {
        first_name: user.name || undefined,
        email: user.email || undefined,
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