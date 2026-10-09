import { NextResponse } from "next/server";
import { getSummary } from "@/lib/receipt";

export async function GET() {
  return NextResponse.json(getSummary());
}
