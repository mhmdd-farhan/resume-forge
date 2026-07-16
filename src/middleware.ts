import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin credentials not configured", { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const expected = "Basic " + btoa(`${username}:${password}`);

  if (authHeader !== expected) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="ResumeForge Admin"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
