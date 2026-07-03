import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, message, stack, url, userAgent } = body;
    const entry = {
      timestamp: new Date().toISOString(),
      level: level || "error",
      message,
      stack,
      url,
      userAgent,
    };
    if (process.env.NODE_ENV === "development") {
      console.error("[FRONTEND_LOG]", JSON.stringify(entry));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
