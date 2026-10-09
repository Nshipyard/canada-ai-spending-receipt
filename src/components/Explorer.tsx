"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n";
import type { Ownership } from "@/lib/receipt";

interface Hit {
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

interface Contract {
  id: string;
  department: string;
  department_short: string;
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

interface Detail extends Hit {
  contracts_list: Contract[];
}

function fmt(n: number, lang: string) {
  return n.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA");
}

function money(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function ownBadge(ownership: Ownership, lang: string) {
  const label =
    ownership === "canadian"
      ? lang === "fr" ? "Canadien" : "Canadian"
      : ownership === "foreign"
        ? lang === "fr" ? "Étranger" : "Foreign"
        : lang === "fr" ? "Incertain" : "Uncertain";
  const cls =
    ownership === "canadian"
      ? "bg-canada/10 text-canada-dark"
      : ownership === "foreign"
        ? "bg-ink/10 text-ink"
        : "bg-ink/5 text-ink/60";
  return <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${cls}`}>{label}</span>;
}

export default function Explorer() {
  const { t, lang } = useLang();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function run(query: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, limit: "50" });
      const res = await fetch(`/api/v1/vendor/search?${params}`);
      const data = await res.json();
      setHits(data.hits ?? []);
      setTotal(data.total ?? 0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function openVendor(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/v1/vendor/lookup?vendor_id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setDetail(data.id ? { ...data, contracts_list: data.contracts ?? [] } : null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => run(q), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const e = t.explorer;

  if (detail || detailLoading) {
    return (
      <div>
        <button
          onClick={() => setDetail(null)}
          className="mb-6 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink"
        >
          ← {e.back}
        </button>
        {detailLoading && <p className="text-[15px] text-ink/55">…</p>}
        {detail && (
          <article className="rounded-[24px] border border-line bg-paper p-6 md:p-8">
            <p className="font-mono text-[12px] uppercase tracking-wide text-ink/45">
              {e.vendorId} · {detail.id}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h3 className="display text-[30px] md:text-[38px]">{detail.name}</h3>
              {ownBadge(detail.ownership, lang)}
            </div>
            <p className="mt-2 text-[14px] text-ink/60">
              {e.hq}: {detail.hq_country}
              {detail.ownership_evidence && (
                <>
                  {" "}·{" "}
                  <a href={detail.ownership_evidence} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:decoration-ink">
                    {e.evidence}
                  </a>
                </>
              )}
            </p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {[
                { v: money(detail.spend), l: e.spend },
                { v: fmt(detail.contracts, lang), l: e.contracts },
                { v: detail.departments.join(", ") || "–", l: e.departments },
                { v: fmt(detail.variants.length, lang), l: e.variants },
              ].map((s) => (
                <div key={s.l} className="bg-paper-warm p-5">
                  <p className="display text-[30px] text-canada">{s.v}</p>
                  <p className="mt-1 text-[13px] text-ink/60">{s.l}</p>
                </div>
              ))}
            </div>
            {detail.variants.length > 1 && (
              <div className="mt-6">
                <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/50">
                  {e.variants} ({fmt(detail.variants.length, lang)})
                </p>
                <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-ink/65">
                  {detail.variants.join(" · ")}
                </p>
              </div>
            )}
            <div className="mt-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/50">{e.contractsTitle}</p>
              <div className="mt-3 overflow-x-auto rounded-[20px] border border-line">
                <table className="w-full min-w-[640px] text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-line bg-muted text-[12px] uppercase tracking-wide text-ink/55">
                      <th className="px-5 py-3 font-medium">{e.spend}</th>
                      <th className="px-5 py-3 font-medium">{e.department}</th>
                      <th className="px-5 py-3 font-medium">{e.year}</th>
                      <th className="px-5 py-3 font-medium">{e.kind}</th>
                      <th className="px-5 py-3 font-medium">{e.source}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.contracts_list.map((c) => (
                      <tr key={c.id} className="border-b border-line last:border-0">
                        <td className="px-5 py-3 font-semibold text-canada-dark">{money(c.amount_cad)}</td>
                        <td className="px-5 py-3 text-ink/70">{c.department_short || c.department}</td>
                        <td className="px-5 py-3 font-mono text-ink/70">{c.fiscal_year || "–"}</td>
                        <td className="px-5 py-3 text-ink/70">{c.kind === "investment" ? e.investment : e.procurement}</td>
                        <td className="px-5 py-3">
                          {c.source_url ? (
                            <a href={c.source_url} target="_blank" rel="noreferrer" className="font-mono text-[13px] text-ink/55 underline decoration-line underline-offset-2 hover:decoration-ink">
                              {c.source_type}
                            </a>
                          ) : (
                            <span className="font-mono text-[13px] text-ink/55">{c.source_type}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        value={q}
        onChange={(ev) => setQ(ev.target.value)}
        placeholder={e.search}
        className="w-full rounded-full border border-line bg-paper px-6 py-3.5 text-[16px] outline-none placeholder:text-ink/35 focus:border-canada"
        aria-label={e.search}
      />
      <div className="mt-8">
        {!searched && !loading && <p className="max-w-[640px] text-[15px] leading-relaxed text-ink/55">{e.empty}</p>}
        {loading && <p className="text-[15px] text-ink/55">…</p>}
        {searched && !loading && hits.length === 0 && <p className="text-[15px] text-ink/55">{e.noResult}</p>}
        {hits.length > 0 && (
          <>
            <p className="mb-4 text-[14px] text-ink/55">
              {e.showing} {hits.length} {e.of} {fmt(total, lang)}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {hits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => openVendor(h.id)}
                  className="rounded-[24px] border border-line bg-paper p-6 text-left transition-colors hover:border-canada"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16px] font-semibold leading-snug">{h.name}</p>
                    {ownBadge(h.ownership, lang)}
                  </div>
                  <p className="mt-1 text-[13px] text-ink/55">{h.hq_country}</p>
                  <p className="display mt-2 text-[32px] text-canada">{money(h.spend)}</p>
                  <p className="mt-1 text-[13px] text-ink/55">
                    {fmt(h.contracts, lang)} {e.contracts}
                    {h.variants.length > 1 ? ` · ${fmt(h.variants.length, lang)} ${e.variants}` : ""}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
