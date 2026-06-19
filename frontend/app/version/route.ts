import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    app: "UnityCare MVP Frontend",
    version: "1.0.0",
    framework: "Next.js",
    node: process.version,
  });
}
