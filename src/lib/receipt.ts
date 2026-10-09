import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");

export type Ownership = "canadian" | "foreign" | "uncertain";

export interface Vendor {
  id: string;
  name: string;
  hq_country: string;
  ownership: Ownership;
  ownership_evidence: string;
  spend: number;
  contracts: number;
  variants: string[];
  departments: string[];
  fiscal_years: string[];
}

export interface Contract {
  id: string;
  department: string;
  department_short: string;
  vendor_id: string;
  vendor_raw: string;
  amount_cad: number;
  fiscal_year: string;
  award_date: string | null;
  description: string;
  kind: "procurement" | "investment";
  source_type: "order_paper" | "canadabuys" | "press";
  source_url: string;
  notes: string;
}

export interface DeptRow {
  department: string;
  spend: number;
  contracts: number;
}

export interface YearRow {
  fiscal_year: string;
  spend: number;
  contracts: number;
}

export interface SummaryMeta {
  retrieved: string;
  data_vintage: string;
  topline_cad: number;
  topline_source: string;
  topline_url: string;
  counting_rule_en: string;
  counting_rule_fr: string;
  coverage_note_en: string;
  coverage_note_fr: string;
  excluded_note_en: string;
  excluded_note_fr: string;
  uncertain_note_en: string;
  uncertain_note_fr: string;
}

export interface Summary {
  meta: SummaryMeta;
  tracked_spend: number;
  procurement_spend: number;
  investment_spend: number;
  canadian_spend: number;
  foreign_spend: number;
  uncertain_spend: number;
  contract_count: number;
  vendor_count: number;
  by_department: DeptRow[];
  by_year: YearRow[];
  top_vendor_ids: string[];
}

function read<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")) as T;
}

let vendorsCache: Vendor[] | null = null;
let contractsCache: Contract[] | null = null;
let summaryCache: Summary | null = null;

export function getVendors(): Vendor[] {
  if (!vendorsCache) vendorsCache = read<Vendor[]>("vendors.json");
  return vendorsCache;
}

export function getContracts(): Contract[] {
  if (!contractsCache) contractsCache = read<Contract[]>("contracts.json");
  return contractsCache;
}

export function getSummary(): Summary {
  if (!summaryCache) summaryCache = read<Summary>("summary.json");
  return summaryCache;
}

export function lookupVendor(id: string): Vendor | null {
  return getVendors().find((v) => v.id === id) ?? null;
}

export function searchVendors(q: string, limit = 50): { hits: Vendor[]; total: number } {
  const all = getVendors();
  const query = q.trim().toLowerCase();
  const hits = query
    ? all.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.variants.some((x) => x.toLowerCase().includes(query)) ||
          v.hq_country.toLowerCase().includes(query)
      )
    : all;
  const ranked = [...hits].sort((a, b) => b.spend - a.spend);
  return { hits: ranked.slice(0, limit), total: hits.length };
}

export function contractsForVendor(id: string): Contract[] {
  return getContracts()
    .filter((c) => c.vendor_id === id)
    .sort((a, b) => b.amount_cad - a.amount_cad);
}
