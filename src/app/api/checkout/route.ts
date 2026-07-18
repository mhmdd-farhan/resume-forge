import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Polar } from "@polar-sh/sdk";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planType } = body;

    let productId: string | undefined;
    if (planType === "starter") {
      productId = process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID;
    } else if (planType === "annual") {
      productId = process.env.NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_ID;
    } else {
      productId = process.env.NEXT_PUBLIC_POLAR_PREMIUM_PRODUCT_ID;
    }

    if (!productId) {
      return NextResponse.json({ error: "Target subscription plan product ID is not configured." }, { status: 400 });
    }

    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Polar access token is missing." }, { status: 500 });
    }

    const polar = new Polar({
      accessToken: token,
      server: "production",
    });

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/generate?checkout_success=true`,
      customerEmail: session.user.email || undefined,
      metadata: {
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    console.error("Error creating Polar checkout session:", err);
    return NextResponse.json({ error: err.message || "Failed to create checkout session." }, { status: 500 });
  }
}
