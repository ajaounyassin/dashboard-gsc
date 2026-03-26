"use client";

import { formatNumber, formatCtr, formatPosition } from "@/lib/data/formatters";
import type { BrandSplit } from "@/lib/types";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

interface BrandNonBrandChartProps {
  data: BrandSplit | null;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      className="px-3 py-2 rounded text-sm"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-subtle)",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <p style={{ color: item.payload.color, fontSize: 11 }}>{item.name}</p>
      <p style={{ color: "var(--foreground)", marginTop: 2 }}>
        {formatNumber(item.value)} clics · {item.payload.pct}%
      </p>
    </div>
  );
};

function StatBlock({
  label, value, sub, accent,
}: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div>
      <div className="label-tag mb-1" style={{ color: accent }}>{label}</div>
      <div className="metric-number text-xl font-bold" style={{ color: "var(--foreground)" }}>{value}</div>
      <div className="label-tag" style={{ color: "var(--text-muted)", fontSize: "9px" }}>{sub}</div>
    </div>
  );
}

export function BrandNonBrandChart({ data, isLoading }: BrandNonBrandChartProps) {
  const brandPct = data?.brandShareClicks ?? 0;
  const nonBrandPct = +(100 - brandPct).toFixed(2);

  const chartData = data ? [
    { name: "BRAND",     value: data.brand.clicks,    pct: brandPct,    color: "#b388ff" },
    { name: "NON-BRAND", value: data.nonBrand.clicks, pct: nonBrandPct, color: "#40c4ff" },
  ] : [];

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="section-title mb-1">Répartition du Trafic</div>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
            Brand <span style={{ color: "var(--accent-violet)" }}>Clean Pro</span> vs SEO pur
          </p>
        </div>
        {data && (
          <div
            className="metric-number text-xs px-3 py-1.5 rounded"
            style={{
              background: "rgba(0, 230, 118, 0.08)",
              color: "var(--accent-green)",
              border: "1px solid rgba(0, 230, 118, 0.15)",
            }}
          >
            {formatNumber(data.totalClicks)} clics total
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-8 items-center">
          <div className="w-44 h-44 rounded-full animate-pulse" style={{ background: "var(--surface-2)" }} />
          <div className="flex-1 space-y-4">
            {[0,1].map(i => <div key={i} className="h-16 rounded animate-pulse" style={{ background: "var(--surface-2)" }} />)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Donut */}
          <div className="w-44 h-44 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Brand block */}
          <div className="flex-1 grid grid-cols-1 gap-4 w-full">
            {/* BRAND */}
            <div
              className="rounded p-4"
              style={{
                background: "rgba(179, 136, 255, 0.06)",
                border: "1px solid rgba(179, 136, 255, 0.15)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "#b388ff" }} />
                <span className="label-tag" style={{ color: "#b388ff" }}>BRAND · {brandPct.toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <StatBlock label="CLICS" value={formatNumber(data?.brand.clicks ?? 0)} sub="période" accent="#b388ff" />
                <StatBlock label="IMPRESSIONS" value={formatNumber(data?.brand.impressions ?? 0)} sub="période" accent="#b388ff" />
                <StatBlock label="CTR" value={formatCtr(data?.brand.ctr ?? 0)} sub="moyen" accent="#b388ff" />
                <StatBlock label="POSITION" value={formatPosition(data?.brand.position ?? 0)} sub="moyenne" accent="#b388ff" />
              </div>
            </div>

            {/* NON-BRAND */}
            <div
              className="rounded p-4"
              style={{
                background: "rgba(64, 196, 255, 0.06)",
                border: "1px solid rgba(64, 196, 255, 0.15)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "#40c4ff" }} />
                <span className="label-tag" style={{ color: "#40c4ff" }}>NON-BRAND · {nonBrandPct.toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <StatBlock label="CLICS" value={formatNumber(data?.nonBrand.clicks ?? 0)} sub="période" accent="#40c4ff" />
                <StatBlock label="IMPRESSIONS" value={formatNumber(data?.nonBrand.impressions ?? 0)} sub="période" accent="#40c4ff" />
                <StatBlock label="CTR" value={formatCtr(data?.nonBrand.ctr ?? 0)} sub="moyen" accent="#40c4ff" />
                <StatBlock label="POSITION" value={formatPosition(data?.nonBrand.position ?? 0)} sub="moyenne" accent="#40c4ff" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
