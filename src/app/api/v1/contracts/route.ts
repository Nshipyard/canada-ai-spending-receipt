import { NextResponse } from "next/server";
import { getContracts, lookupVendor } from "@/lib/receipt";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const vendorId = url.searchParams.get("vendor_id");
  const department = url.searchParams.get("department");
  const ownership = url.searchParams.get("ownership");
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 1), 500);
  let rows = getContracts();
  if (vendorId) rows = rows.filter((c) => c.vendor_id === vendorId);
  if (department) {
    const d = department.toLowerCase();
    rows = rows.filter(
      (c) => c.department.toLowerCase().includes(d) || c.department_short.toLowerCase() === d
    );
  }
  if (ownership) {
    const o = ownership.toLowerCase();
    rows = rows.filter((c) => lookupVendor(c.vendor_id)?.ownership === o);
  }
  const sorted = [...rows].sort((a, b) => b.amount_cad - a.amount_cad);
  return NextResponse.json({ total: rows.length, limit, contracts: sorted.slice(0, limit) });
}
