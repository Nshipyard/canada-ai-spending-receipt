import { NextResponse } from "next/server";
import { lookupVendor, contractsForVendor } from "@/lib/receipt";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const vendorId = url.searchParams.get("vendor_id") ?? "";
  if (!vendorId) {
    return NextResponse.json({ error: "vendor_id query parameter is required" }, { status: 400 });
  }
  const hit = lookupVendor(vendorId);
  if (!hit) {
    return NextResponse.json({ error: `No vendor with id ${vendorId}` }, { status: 404 });
  }
  return NextResponse.json({ ...hit, contracts: contractsForVendor(vendorId) });
}
