import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "The $800M Receipt API",
    version: "1.0.0",
    description:
      "Federal AI spending in Canada since 2023, compiled contract by contract and coded Canadian-owned vs foreign-owned per vendor. Vendor search and lookup, spend aggregates, and the full contract list with ownership flags. Sources: Canadian Press reporting on the $800M+ topline, parliamentary Order Paper written-question responses, CanadaBuys award notices, and the Wire Report's Q-1229 investigation. MIT licensed.",
  },
  servers: [{ url: "https://aispend.canada.nshipyard.com/api/v1" }],
  paths: {
    "/summary": {
      get: {
        summary: "Headline aggregates: tracked spend, Canadian vs foreign vs uncertain split, counts, by department and fiscal year",
        responses: { "200": { description: "Full aggregate summary with methodology notes and caveats" } },
      },
    },
    "/vendor/search": {
      get: {
        summary: "Search canonical AI vendors by name, ranked by total spend",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "Cohere" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 200 } },
        ],
        responses: { "200": { description: "Total plus matching vendor records with ownership coding and spend aggregates" } },
      },
    },
    "/vendor/lookup": {
      get: {
        summary: "Full record for one vendor: ownership coding, HQ country, spend, contracts, name variants, evidence link",
        parameters: [{ name: "vendor_id", in: "query", required: true, schema: { type: "string" }, example: "V00001" }],
        responses: { "200": { description: "Vendor record with its contracts" }, "404": { description: "No vendor with that id" } },
      },
    },
    "/contracts": {
      get: {
        summary: "Contract-by-contract list with ownership flags, filterable by vendor, department, or ownership",
        parameters: [
          { name: "vendor_id", in: "query", required: false, schema: { type: "string" } },
          { name: "department", in: "query", required: false, schema: { type: "string" }, example: "PSPC" },
          { name: "ownership", in: "query", required: false, schema: { type: "string", enum: ["canadian", "foreign", "uncertain"] } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 100, maximum: 500 } },
        ],
        responses: { "200": { description: "Total plus contracts sorted by amount, largest first" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
