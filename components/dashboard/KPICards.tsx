"use client";

import { formatNumber, formatCtr, formatPosition } from "@/lib/data/formatters";
import type { KPIOverview } from "@/lib/types";

interface KPICardsProps {
  data: KPIOverview | null;
  isLoading: boolean;
}

const METRICS = [
  {
    key: "clicks" as const,
    label: "CLICS",
    unit: "",
    accent: "var(--accent-green)",
    glow: "rgba(0, 230, 118, 0.12)",
    format: (v: number) => formatNumber(v),
    desc: "Total période",
  },
  {
    key: "impressions" as const,
    label: "IMPRESSIONS",
    unit: "",
    accent: "var(--accent-blue)",
    glow: "rgba(64, 196, 255, 0.10)",
    format: (v: number) => formatNumber(v),
    desc: "Total période",
  },
  {
    key: "avgCtr" as const,
    label: "CTR MOYEN",
    unit: "",
    accent: "var(--accent-amber)",
    glow: "rgba(255, 171, 0, 0.10)",
    format: (v: number) => formatCtr(v),
    desc: "Pondéré impressions",
  },
  {
    key: "avgPosition" as const,
    label: "POSITION MOY.",
    unit: "",
    accent: "var(--accent-violet)",
    glow: "rgba(179, 136, 255, 0.10)",
    format: (v: number) => formatPosition(v),
    desc: "Pondérée impressions",
  },
];

function SkeletonCard() {
  return (
    <div className="panel p-5">
      <div
        className="h-3 w-24 rounded mb-4 animate-pulse"
        style={{ background: "var(--surface-3)" }}
      />
      <div
        className="h-8 w-32 rounded mb-2 animate-pulse"
        style={{ background: "var(--surface-3)" }}
      />
      <div
        className="h-2.5 w-16 rounded animate-pulse"
        style={{ background: "var(--surface-3)" }}
      />
    </div>
  );
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {METRICS.map((m, i) => {
        const value = data?.totals?.[m.key] ?? 0;
        return (
          <div
            key={m.key}
            className="panel p-5 animate-fade-up"
            style={{
              animationDelay: `${i * 60}ms`,
              boxShadow: `inset 0 0 30px ${m.glow}`,
            }}
          >
            {/* Accent line top */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: m.accent, opacity: 0.4 }}
            />

            <div className="label-tag mb-3" style={{ color: m.accent }}>
              {m.label}
            </div>

            <div
              className="metric-number text-3xl font-bold mb-1 leading-none"
              style={{ color: m.accent }}
            >
              {m.format(value)}
            </div>

            <div className="label-tag" style={{ color: "var(--text-dim)" }}>
              {m.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}
