import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

const FREE_LIMIT = 3;
const STARTER_DAILY_LIMIT = 4;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        name: true,
        email: true,
        image: true,
        plan: true,
        resumesGenerated: true,
        dailyResumesGenerated: true,
        lastGenerationDate: true,
        polarCustomerId: true,
        polarSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hasSubscription = !!user.polarSubscriptionId;
    const isPremium = (user.plan === "premium" || user.plan === "annual") && hasSubscription;
    const isStarter = user.plan === "starter" && hasSubscription;

    // For starter plan, reset daily count if it's a new day
    const today = todayUtc();
    const isNewDay = user.lastGenerationDate !== today;
    const dailyUsed = (isStarter && isNewDay) ? 0 : user.dailyResumesGenerated;

    let remaining: number | null;
    let limitPeriod: "total" | "daily" | null;

    if (isPremium) {
      remaining = null;
      limitPeriod = null;
    } else if (isStarter) {
      remaining = Math.max(0, STARTER_DAILY_LIMIT - dailyUsed);
      limitPeriod = "daily";
    } else {
      remaining = Math.max(0, FREE_LIMIT - user.resumesGenerated);
      limitPeriod = "total";
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      plan: user.plan,
      resumesGenerated: user.resumesGenerated,
      dailyUsed,
      remaining,
      limitPeriod,
      isPremium,
      isStarter,
      hasSubscription,
    });
  } catch (err: any) {
    console.error("Error fetching dashboard data:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
