"use client";

import { useMemo } from "react";
import { useLang } from "@/i18n";
import type { Ownership } from "@/lib/receipt";

export interface TreeItem {
  id: string;
  name: string;
  short: string;
  spend: number;
  ownership: Ownership;
}

interface Block extends TreeItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

function squarify(items: TreeItem[], x: number, y: number, w: number, h: number): Block[] {
  const total = items.reduce((s, i) => s + i.spend, 0);
  if (total <= 0) return [];
  const scale = (w * h) / total;
  const rows: Block[] = [];
  let row: TreeItem[] = [];
  let rowSpend = 0;
  let cx = x;
  let cy = y;
  let cw = w;
  let ch = h;

  const worst = (r: TreeItem[], rs: number, side: number) => {
    if (r.length === 0 || rs <= 0) return Infinity;
    const max = Math.max(...r.map((i) => i.spend));
    const min = Math.min(...r.map((i) => i.spend));
    const s2 = rs * scale;
    return Math.max((side * side * max * scale) / (s2 * s2), (s2 * s2) / (side * side * min * scale));
  };

  const layoutRow = (r: TreeItem[], rs: number) => {
    const horizontal = cw >= ch;
    const rowLen = rs * scale;
    if (horizontal) {
      const rh = rowLen / cw;
      let rx = cx;
      for (const i of r) {
        const bw = (i.spend * scale) / rh;
        rows.push({ ...i, x: rx, y: cy, w: bw, h: rh });
        rx += bw;
      }
      cy += rh;
      ch -= rh;
    } else {
      const rw = rowLen / ch;
      let ry = cy;
      for (const i of r) {
        const bh = (i.spend * scale) / rw;
        rows.push({ ...i, x: cx, y: ry, w: rw, h: bh });
        ry += bh;
      }
      cx += rw;
      cw -= rw;
    }
  };

  for (const item of items) {
    const side = Math.min(cw, ch);
    const trial = [...row, item];
    if (row.length === 0 || worst(trial, rowSpend + item.spend, side) <= worst(row, rowSpend, side)) {
      row = trial;
      rowSpend += item.spend;
    } else {
      layoutRow(row, rowSpend);
      row = [item];
      rowSpend = item.spend;
    }
  }
  if (row.length > 0) layoutRow(row, rowSpend);
  return rows;
}

const REDS = ["#d80621", "#c00520", "#a80419", "#e01e38", "#8f0316", "#ef4059"];
const INKS = ["#0a0f1e", "#1b2340", "#2c3556", "#3d466e", "#141b33", "#232c4e"];
const GRAYS = ["#9aa1b5", "#8a91a8", "#aab0c2"];

function colorFor(item: TreeItem, i: number): string {
  if (item.ownership === "canadian") return REDS[i % REDS.length];
  if (item.ownership === "foreign") return INKS[i % INKS.length];
  return GRAYS[i % GRAYS.length];
}

function money(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function Treemap({ items }: { items: TreeItem[] }) {
  const { t } = useLang();
  const W = 1000;
  const H = 620;
  const blocks = useMemo(() => squarify(items, 0, 0, W, H), [items]);
  const sorted = useMemo(() => items.map((i, idx) => ({ ...i, idx })).sort((a, b) => b.spend - a.spend), [items]);

  return (
    <figure className="overflow-hidden rounded-[24px] border border-line bg-paper">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={t.receipt.treemapLabel}>
        {blocks.map((b) => {
          const idx = sorted.findIndex((s) => s.id === b.id);
          const fill = colorFor(b, idx);
          const showText = b.w > 110 && b.h > 56;
          const showAmount = b.w > 130 && b.h > 84;
          return (
            <g key={b.id}>
              <title>{`${b.name}: ${money(b.spend)} (${b.ownership})`}</title>
              <rect x={b.x + 1.5} y={b.y + 1.5} width={Math.max(0, b.w - 3)} height={Math.max(0, b.h - 3)} rx={6} fill={fill} />
              {showText && (
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 - (showAmount ? 8 : 0)} textAnchor="middle" fill="#fff" fontSize={Math.min(20, Math.max(12, b.w / 12))} fontWeight={600}>
                  {b.short}
                </text>
              )}
              {showAmount && (
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 18} textAnchor="middle" fill="#fff" opacity={0.85} fontSize={15}>
                  {money(b.spend)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-6 py-4 text-[13px] text-ink/65">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 rounded-[4px] bg-canada" /> {t.receipt.legendCanadian}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 rounded-[4px] bg-ink" /> {t.receipt.legendForeign}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 rounded-[4px] bg-[#9aa1b5]" /> {t.receipt.legendUncertain}
        </span>
      </figcaption>
    </figure>
  );
}
