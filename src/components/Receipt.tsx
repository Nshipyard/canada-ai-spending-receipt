"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n";
import Treemap, { type TreeItem } from "./Treemap";
import type { Ownership } from "@/lib/receipt";

interface VendorHit {
  id: string;
  name: string;
  hq_country: string;
  ownership: Ownership;
  spend: number;
  contracts: number;
}

interface Summary {
  tracked_spend: number;
  procurement_spend: number;
  investment_spend: number;
  canadian_spend: number;
  foreign_spend: number;
  uncertain_spend: number;
  contract_count: number;
  vendor_count: number;
}

function money(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function shortName(name: string): string {
  const cleaned = name
    .replace(/\s+(Inc\.?|Incorporated|Corp\.?|Corporation|Ltd\.?|Limited|LLC|LLP|S\.?A\.?)\s*$/i, "")
    .replace(/[,.\s]+$/, "")
    .trim();
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) return cleaned;
  return words.slice(0, 2).join(" ");
}

export function useSummary(): Summary | null {
  const [s, setS] = useState<Summary | null>(null);
  useEffect(() => {
    fetch("/api/v1/summary")
      .then((r) => r.json())
      .then((d) => setS(d))
      .catch(() => {});
  }, []);
  return s;
}

export function useVendors(limit = 200): VendorHit[] {
  const [v, setV] = useState<VendorHit[]>([]);
  useEffect(() => {
    fetch(`/api/v1/vendor/search?limit=${limit}`)
      .then((r) => r.json())
      .then((d) => setV(d.hits ?? []))
      .catch(() => {});
  }, [limit]);
  return v;
}

function flag(hq: string): string {
  const c = hq.toLowerCase();
  if (c.includes("canada")) return "🇨🇦";
  if (c.includes("united states") || c === "usa" || c === "us") return "🇺🇸";
  if (c.includes("united kingdom") || c === "uk") return "🇬🇧";
  if (c.includes("france")) return "🇫🇷";
  if (c.includes("germany")) return "🇩🇪";
  if (c.includes("india")) return "🇮🇳";
  return "🌐";
}

export function ReceiptVisual() {
  const { t } = useLang();
  const vendors = useVendors(200);

  const items: TreeItem[] = useMemo(() => {
    if (vendors.length === 0) return [];
    const total = vendors.reduce((s, v) => s + v.spend, 0);
    // Individual blocks only for vendors large enough to label (2% of area);
    // everything smaller merges into the per-ownership tail buckets so the
    // treemap never degenerates into unreadable slivers.
    const threshold = total * 0.02;
    const big = vendors.filter((v) => v.spend >= threshold);
    const small = vendors.filter((v) => v.spend < threshold);
    const out: TreeItem[] = big.map((v) => ({
      id: v.id,
      name: v.name,
      short: shortName(v.name),
      spend: v.spend,
      ownership: v.ownership,
    }));
    (["canadian", "foreign", "uncertain"] as Ownership[]).forEach((o) => {
      const group = small.filter((v) => v.ownership === o);
      const spend = group.reduce((s, v) => s + v.spend, 0);
      if (spend > 0) {
        out.push({
          id: `tail-${o}`,
          name: `${group.length} ${o} vendors`,
          short: `${group.length} ${o === "canadian" ? t.receipt.tailCanadian : o === "foreign" ? t.receipt.tailForeign : t.receipt.tailUncertain}`,
          spend,
          ownership: o,
        });
      }
    });
    return out;
  }, [vendors, t]);

  const top10 = useMemo(() => vendors.slice(0, 10), [vendors]);

  return (
    <div>
      {items.length > 0 ? (
        <Treemap items={items} />
      ) : (
        <div className="rounded-[24px] border border-line bg-paper p-10 text-[15px] text-ink/55">…</div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h3 className="display text-[28px] md:text-[34px]">{t.receipt.topTitle}</h3>
          <p className="mt-2 text-[15px] text-ink/60">{t.receipt.topSub}</p>
          <ol className="mt-6 space-y-3">
            {top10.map((v, i) => (
              <li key={v.id} className="flex items-center gap-4 rounded-[16px] border border-line bg-paper px-5 py-3.5">
                <span className="display w-8 shrink-0 text-[20px] text-ink/35">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {flag(v.hq_country)} {v.name}
                  </p>
                  <p className="text-[13px] text-ink/55">
                    {v.hq_country} · {v.contracts} {t.receipt.contractsWord}
                  </p>
                </div>
                <p className={`display shrink-0 text-[22px] ${v.ownership === "canadian" ? "text-canada" : v.ownership === "foreign" ? "text-ink" : "text-ink/45"}`}>
                  {money(v.spend)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[24px] bg-ink p-7 text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/55">{t.receipt.procuraKicker}</p>
            <p className="display mt-3 text-[30px] leading-tight">{t.receipt.procuraTitle}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/75">{t.receipt.procuraBody}</p>
            <a
              href="https://www.thewirereport.ca/2026/10/01/disguise-canadian-feds-frame-u-s-chatbot-contracts-as-ottawa-based-procurement/"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block rounded-full border border-white/25 px-5 py-2 text-[14px] font-semibold hover:border-white"
            >
              {t.receipt.procuraLink} →
            </a>
          </div>
          <div className="rounded-[24px] border border-canada/30 bg-canada/[0.04] p-7">
            <p className="display text-[24px] leading-tight text-canada-dark">{t.receipt.policyNote}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Caveats() {
  const { t } = useLang();
  return (
    <section className="mt-16 rounded-[24px] border border-line bg-paper-warm p-7 md:p-9">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-canada">{t.receipt.caveatsKicker}</p>
      <h3 className="display mt-3 text-[28px] md:text-[34px]">{t.receipt.caveatsTitle}</h3>
      <ul className="mt-6 space-y-4">
        {t.receipt.caveats.map((c, i) => (
          <li key={i} className="flex gap-4">
            <span className="display shrink-0 text-[22px] text-canada">{String(i + 1).padStart(2, "0")}</span>
            <p className="pt-0.5 text-[15px] leading-relaxed text-ink/75">{c}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
