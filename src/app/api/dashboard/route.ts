import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

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
        polarCustomerId: true,
        polarSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const FREE_LIMIT = 3;
    const isPremium = user.plan === "premium" || user.plan === "annual";
    const remaining = isPremium ? null : Math.max(0, FREE_LIMIT - user.resumesGenerated);

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      plan: user.plan,
      resumesGenerated: user.resumesGenerated,
      remaining,
      isPremium,
      hasSubscription: !!user.polarSubscriptionId,
    });
  } catch (err: any) {
    console.error("Error fetching dashboard data:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
