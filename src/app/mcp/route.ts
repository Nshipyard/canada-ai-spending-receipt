import { NextResponse } from "next/server";
import { getSummary, getContracts, searchVendors, lookupVendor, contractsForVendor } from "@/lib/receipt";

// Minimal MCP server over streamable HTTP (JSON-RPC 2.0 via POST).
// Supports: initialize, tools/list, tools/call. Stateless.

const SERVER = { name: "canada-ai-spending-receipt", version: "1.0.0" };

const TOOLS = [
  {
    name: "vendor_lookup",
    description:
      "Full record for one canonical federal AI vendor: Canadian vs foreign ownership coding, HQ country, total spend, contract count, name variants merged by entity resolution, and its contracts.",
    inputSchema: {
      type: "object",
      properties: {
        vendor_id: { type: "string", description: "Vendor id, e.g. V00001 from the search tool" },
      },
      required: ["vendor_id"],
    },
  },
  {
    name: "vendor_search",
    description:
      "Search the canonical vendors behind Ottawa's tracked AI spend since 2023 by name, ranked by total spend, with ownership coding.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Vendor name fragment" },
        limit: { type: "integer", description: "Max results, default 50, max 200" },
      },
    },
  },
  {
    name: "contracts_list",
    description:
      "Contract-by-contract list of tracked federal AI spending with ownership flags, filterable by vendor id, department, or ownership.",
    inputSchema: {
      type: "object",
      properties: {
        vendor_id: { type: "string", description: "Optional vendor id filter" },
        department: { type: "string", description: "Optional department filter, e.g. PSPC" },
        ownership: { type: "string", description: "Optional ownership filter: canadian, foreign, uncertain" },
      },
    },
  },
  {
    name: "spend_summary",
    description:
      "Federal AI spend aggregates: tracked total, Canadian vs foreign vs uncertain split, procurement vs investment, spend by department and fiscal year, plus the counting rule and coverage caveats.",
    inputSchema: { type: "object", properties: {} },
  },
];

function ok(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function err(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function textResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function handle(msg: any) {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id ?? null, -32600, "Invalid Request");
  }
  const id = msg.id ?? null;
  switch (msg.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    case "notifications/initialized":
      return null;
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args } = msg.params ?? {};
      try {
        if (name === "vendor_lookup") {
          const hit = lookupVendor(String(args.vendor_id ?? ""));
          if (!hit) return err(id, -32001, `No vendor ${args.vendor_id}`);
          return ok(id, textResult({ ...hit, contracts: contractsForVendor(hit.id) }));
        }
        if (name === "vendor_search") {
          const q = String(args.q ?? "");
          const limit = Math.min(Math.max(parseInt(String(args.limit ?? "50"), 10) || 50, 1), 200);
          return ok(id, textResult({ q, limit, ...searchVendors(q, limit) }));
        }
        if (name === "contracts_list") {
          let rows = getContracts();
          const vendorId = String(args.vendor_id ?? "");
          const department = String(args.department ?? "");
          const ownership = String(args.ownership ?? "");
          if (vendorId) rows = rows.filter((c) => c.vendor_id === vendorId);
          if (department) {
            const d = department.toLowerCase();
            rows = rows.filter(
              (c) => c.department.toLowerCase().includes(d) || c.department_short.toLowerCase() === d
            );
          }
          if (ownership) rows = rows.filter((c) => lookupVendor(c.vendor_id)?.ownership === ownership.toLowerCase());
          const sorted = [...rows].sort((a, b) => b.amount_cad - a.amount_cad);
          return ok(id, textResult({ total: rows.length, contracts: sorted }));
        }
        if (name === "spend_summary") {
          return ok(id, textResult(getSummary()));
        }
        return err(id, -32602, `Unknown tool ${name}`);
      } catch (e) {
        return err(id, -32000, `Tool error: ${(e as Error).message}`);
      }
    }
    default:
      return err(id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400 });
  }
  if (Array.isArray(body)) {
    const out = body.map(handle).filter((r) => r !== null);
    return NextResponse.json(out);
  }
  const out = handle(body);
  if (out === null) return new NextResponse(null, { status: 202 });
  return NextResponse.json(out);
}

export async function GET() {
  return NextResponse.json(
    { error: "This MCP server accepts JSON-RPC 2.0 via POST only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}
