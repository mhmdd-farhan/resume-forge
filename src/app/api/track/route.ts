import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { type, name } = await req.json();
    if (type === "pageview" && typeof name === "string") {
      await prisma.pageView.create({ data: { path: name } });
    } else if (type === "click" && typeof name === "string") {
      await prisma.clickEvent.create({ data: { event: name } });
    }
  } catch {
    // fire-and-forget — never fail the client
  }
  return NextResponse.json({ ok: true });
}
