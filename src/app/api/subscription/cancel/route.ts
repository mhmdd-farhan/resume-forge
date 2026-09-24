import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const active =
      user.plan !== "free" &&
      user.planExpiresAt !== null &&
      user.planExpiresAt.getTime() > Date.now();

    if (!active) {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 },
      );
    }

    // Midtrans is a one-time payment (no recurring billing to revoke) —
    // cancellation only demotes the local plan.
    await prisma.user.update({
      where: { id: userId },
      data: { plan: "free", planExpiresAt: null },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (err: any) {
    console.error("Error cancelling subscription:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}