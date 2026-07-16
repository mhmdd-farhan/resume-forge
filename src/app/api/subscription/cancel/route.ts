import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Polar } from "@polar-sh/sdk";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch current subscription ID from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        polarSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.plan === "free" || !user.polarSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Polar access token not configured" },
        { status: 500 }
      );
    }

    const polar = new Polar({
      accessToken: token,
      server: "sandbox",
    });

    // Cancel at end of current billing period (revoke = immediate, cancel = end of period)
    // We use subscriptions.revoke for immediate cancellation as requested
    await polar.subscriptions.revoke({ id: user.polarSubscriptionId });

    // Immediately update DB — webhook will also fire but this gives instant feedback
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "free",
        polarSubscriptionId: null,
      },
    });

    return NextResponse.json({ success: true, message: "Subscription cancelled successfully" });
  } catch (err: any) {
    console.error("Error cancelling subscription:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
