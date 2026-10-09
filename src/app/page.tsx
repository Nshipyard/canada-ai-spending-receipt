"use client";

import { useLang } from "@/i18n";
import { Banner, Nav, Footer } from "@/components/chrome";
import { ReceiptVisual, Caveats, useSummary } from "@/components/Receipt";
import Explorer from "@/components/Explorer";
import Methodology from "@/components/Methodology";
import Developers from "@/components/Developers";

function money(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function Hero() {
  const { t } = useLang();
  const s = useSummary();
  const tracked = s?.tracked_spend ?? 0;
  const can = s?.canadian_spend ?? 0;
  const foreign = s?.foreign_spend ?? 0;
  // One decimal when the share would otherwise round to 0% or 100%,
  // so small-but-real foreign/uncertain dollars stay visible.
  const pct = (n: number) => {
    if (tracked <= 0) return "…";
    const p = (n / tracked) * 100;
    const r = Math.round(p);
    if ((r === 100 && p < 100) || (r === 0 && p > 0)) return `${p.toFixed(1)}%`;
    return `${r}%`;
  };
  const stats = [
    { value: s ? money(tracked) : "…", label: t.stats[0].label },
    { value: s ? pct(can) : "…", label: t.stats[1].label },
    { value: s ? pct(foreign) : "…", label: t.stats[2].label },
    { value: s ? String(s.contract_count) : "…", label: t.stats[3].label },
  ];
  return (
    <section id="top" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 pb-16 pt-16 md:pb-24 md:pt-24">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.hero.kicker}</p>
        <h1 className="display mt-5 max-w-[880px] text-[52px] md:text-[84px]">{t.hero.title}</h1>
        <p className="mt-6 max-w-[680px] text-[19px] leading-relaxed text-ink/70 md:text-[21px]">{t.hero.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#treemap" className="rounded-full bg-canada px-7 py-3.5 text-[16px] font-semibold text-white hover:bg-canada-dark">
            {t.hero.cta1}
          </a>
          <a href="#methodology" className="rounded-full border border-line px-7 py-3.5 text-[16px] font-semibold hover:border-ink">
            {t.hero.cta2}
          </a>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((st, i) => (
            <div key={i} className="bg-paper p-7">
              <p className="display text-[44px] text-canada">{st.value}</p>
              <p className="mt-2 text-[15px] leading-snug text-ink/65">{st.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReceiptSection() {
  const { t } = useLang();
  return (
    <section id="treemap" className="bg-paper-warm">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.receipt.kicker}</p>
        <h2 className="display mt-4 max-w-[760px] text-[40px] md:text-[52px]">{t.receipt.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.receipt.body}</p>
        <div className="mt-10">
          <ReceiptVisual />
        </div>
        <Caveats />
      </div>
    </section>
  );
}

function ExplorerSection() {
  const { t } = useLang();
  return (
    <section id="explorer" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.explorer.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.explorer.title}</h2>
        <div className="mt-10">
          <Explorer />
        </div>
      </div>
    </section>
  );
}

function Downloads() {
  const { t } = useLang();
  return (
    <section id="data" className="bg-paper">
      <div className="mx-auto max-w-[1392px] px-6 py-20 md:py-28">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-canada">{t.downloads.kicker}</p>
        <h2 className="display mt-4 max-w-[720px] text-[40px] md:text-[52px]">{t.downloads.title}</h2>
        <p className="mt-5 max-w-[720px] text-[18px] leading-relaxed text-ink/70">{t.downloads.body}</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {t.downloads.files.map((f) => (
            <div key={f.name} className="flex items-center justify-between gap-4 rounded-[24px] border border-line bg-paper-warm p-6">
              <div>
                <code className="font-mono text-[15px] font-medium">{f.name}</code>
                <p className="mt-1 text-[14px] text-ink/60">{f.desc}</p>
              </div>
              <a href={`/data/${f.name}`} download className="shrink-0 rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold hover:border-ink">
                {t.downloads.download}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Banner />
      <Nav />
      <main className="flex-1">
        <Hero />
        <ReceiptSection />
        <ExplorerSection />
        <Methodology />
        <Developers />
        <Downloads />
      </main>
      <Footer />
    </>
  );
}
