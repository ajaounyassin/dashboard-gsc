"use client";

import { useState } from "react";
import { formatNumber, truncateUrl } from "@/lib/data/formatters";
import type { WinnersLosers as WinnersLosersType, PagePerformance } from "@/lib/types";

interface WinnersLosersProps {
  data: WinnersLosersType | null;
  isLoading: boolean;
}

function DeltaCell({ delta, pct }: { delta: number; pct: number }) {
  const isUp = delta >= 0;
  const color = isUp ? "var(--accent-green)" : "var(--accent-red)";
  const symbol = isUp ? "▲" : "▼";
  return (
    <div>
      <div
        className="metric-number text-sm font-bold"
        style={{ color }}
      >
        {symbol} {formatNumber(Math.abs(delta))}
      </div>
      <div
        className="metric-number text-[10px]"
        style={{ color, opacity: 0.7 }}
      >
        {isUp ? "+" : ""}{pct.toFixed(1)}%
      </div>
    </div>
  );
}

function PageRow({ row, rank }: { row: PagePerformance; rank: number }) {
  return (
    <div
      className="data-row grid px-5 py-3 items-center"
      style={{
        gridTemplateColumns: "20px 1fr 80px 80px 90px",
        borderBottom: "1px solid var(--border-dim)",
      }}
    >
      {/* Rank */}
      <div className="label-tag" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
        {String(rank).padStart(2, "0")}
      </div>

      {/* Page */}
      <div className="min-w-0 pr-3">
        <a
          href={row.page}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs block truncate hover:underline"
          style={{ color: "var(--accent-blue)", fontFamily: "'DM Sans', sans-serif" }}
          title={row.page}
        >
          {truncateUrl(row.page, 50)}
        </a>
        <div className="label-tag" style={{ fontSize: "9px", marginTop: 2 }}>
          Pos. {row.currentPosition} · CTR {row.currentCtr.toFixed(1)}%
        </div>
      </div>

      {/* Current */}
      <div className="metric-number text-xs font-medium" style={{ color: "var(--foreground)" }}>
        {formatNumber(row.currentClicks)}
      </div>

      {/* Previous */}
      <div className="metric-number text-xs" style={{ color: "var(--text-muted)" }}>
        {formatNumber(row.previousClicks)}
      </div>

      {/* Delta */}
      <DeltaCell delta={row.deltaClicks} pct={row.deltaPercent} />
    </div>
  );
}

export function WinnersLosers({ data, isLoading }: WinnersLosersProps) {
  const [tab, setTab] = useState<"winners" | "losers">("winners");

  const rows = tab === "winners" ? data?.winners ?? [] : data?.losers ?? [];

  return (
    <div className="panel flex flex-col" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="section-title mb-1" style={{ color: "var(--foreground)" }}>
          ◆ TOP MOVERS
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
          30j actuels vs 30j précédents — variation de clics par page
        </p>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        {(["winners", "losers"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 px-5 py-3 text-xs font-medium transition-all"
            style={{
              fontFamily: "'Oxanium', sans-serif",
              letterSpacing: "0.08em",
              background: tab === t
                ? t === "winners" ? "rgba(0, 230, 118, 0.06)" : "rgba(255, 82, 82, 0.06)"
                : "transparent",
              color: tab === t
                ? t === "winners" ? "var(--accent-green)" : "var(--accent-red)"
                : "var(--text-muted)",
              borderBottom: tab === t
                ? `2px solid ${t === "winners" ? "var(--accent-green)" : "var(--accent-red)"}`
                : "2px solid transparent",
            }}
          >
            {t === "winners" ? "▲ WINNERS" : "▼ LOSERS"}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div
        className="grid px-5 py-2"
        style={{
          gridTemplateColumns: "20px 1fr 80px 80px 90px",
          borderBottom: "1px solid var(--border-dim)",
        }}
      >
        {["#", "PAGE", "ACTUEL", "PRÉC.", "DELTA"].map(h => (
          <div key={h} className="label-tag" style={{ fontSize: "9px" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid px-5 py-3"
              style={{ gridTemplateColumns: "20px 1fr 80px 80px 90px", borderBottom: "1px solid var(--border-dim)" }}
            >
              <div className="h-2.5 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 12 }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: "60%" }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 40 }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 40 }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 50 }} />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="label-tag" style={{ color: "var(--text-dim)" }}>AUCUNE DONNÉE</p>
          </div>
        ) : (
          rows.map((row, idx) => <PageRow key={idx} row={row} rank={idx + 1} />)
        )}
      </div>
    </div>
  );
}
