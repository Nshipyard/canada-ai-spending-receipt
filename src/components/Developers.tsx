"use client";

import { useLang } from "@/i18n";
import McpConnect from "./McpConnect";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/vendor/search?q=cohere&limit=3",
    desc: "Search canonical AI vendors by name, ranked by total spend, with ownership coding",
    response: `{
  "q": "cohere",
  "limit": 3,
  "total": 1,
  "hits": [
    {
      "id": "V00002",
      "name": "Cohere Inc.",
      "hq_country": "Canada",
      "ownership": "canadian",
      "spend": 240000000,
      "contracts": 1
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/vendor/lookup?vendor_id=V00002",
    desc: "Full vendor record: ownership coding, HQ country, evidence link, contracts",
    response: `{
  "id": "V00002",
  "name": "Cohere Inc.",
  "hq_country": "Canada",
  "ownership": "canadian",
  "spend": 240000000, "contracts": 1,
  "variants": ["Cohere Inc.", "Cohere"],
  "ownership_evidence": "https://…",
  "contracts": [ { "amount_cad": 240000000,
    "kind": "investment", "department_short": "PSPC" } ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/summary",
    desc: "Headline aggregates: tracked total, Canadian vs foreign vs uncertain split, by department and year",
    response: `{ "tracked_spend": 655333098,
  "procurement_spend": 415333098,
  "investment_spend": 240000000,
  "canadian_spend": 638516107,
  "foreign_spend": 16411446,
  "uncertain_spend": 405545,
  "contract_count": 42, "vendor_count": 39,
  "by_department": [ … ] }`,
  },
  {
    method: "GET",
    path: "/api/v1/contracts?ownership=foreign&limit=10",
    desc: "Contract-by-contract list with ownership flags, largest first",
    response: `{ "total": 2, "limit": 10,
  "contracts": [ { "amount_cad": 609761,
    "vendor_raw": "Teksystems Canada Corp",
    "department_short": "PSPC",
    "source_type": "press" } ] }`,
  },
];

export default function Developers() {
  const { t } = useLang();
  return (
    <section id="developers" className="bg-ink text-white">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.developers.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-white/70">{t.developers.body}</p>

        <h3 className="mt-14 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{t.developers.endpoints}</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {endpoints.map((e) => (
            <article key={e.path} className="flex min-w-0 flex-col rounded-[24px] border border-white/15 bg-white/5 p-6">
              <p className="font-mono text-[12px] font-semibold text-white/60">{e.method}</p>
              <code className="mt-1 break-all font-mono text-[13px] text-white">{e.path}</code>
              <p className="mt-2 text-[14px] text-white/65">{e.desc}</p>
              <pre className="mt-4 flex-1 overflow-x-auto rounded-[16px] bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-white/80">
                {e.response}
              </pre>
              <a
                href={e.path}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block self-start rounded-full border border-white/25 px-5 py-2 text-[14px] font-semibold hover:border-white"
              >
                {t.developers.tryIt} →
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <a href="/api/openapi.json" target="_blank" rel="noreferrer" className="block rounded-[24px] bg-white/[0.06] p-6 hover:bg-white/[0.09]">
            <h4 className="text-[19px] font-semibold">{t.developers.openapi}</h4>
            <code className="mt-2 block font-mono text-[13px] text-white/60">GET /api/openapi.json</code>
          </a>
        </div>

        <McpConnect
          config={{
            slug: "ai-spending-receipt",
            displayName: "The $800M Receipt",
            exampleEn: 'Look up the biggest foreign-owned vendor and show its contracts',
            exampleFr: "Trouve le plus gros fournisseur étranger et montre ses contrats",
          }}
        />
      </div>
    </section>
  );
}
