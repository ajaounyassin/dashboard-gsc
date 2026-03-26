"use client";

import { formatNumber } from "@/lib/data/formatters";
import type { LowHangingFruit } from "@/lib/types";

interface LowHangingFruitsProps {
  data: LowHangingFruit[];
  isLoading: boolean;
}

function PositionBadge({ position }: { position: number }) {
  // Closer to 11 = warmer color (almost on page 1)
  const proximity = (20 - position) / 9; // 0 = pos 20, 1 = pos 11
  const color = proximity > 0.6 ? "var(--accent-green)" : proximity > 0.3 ? "var(--accent-amber)" : "var(--accent-red)";
  return (
    <div className="flex items-center gap-2">
      <div
        className="metric-number text-xs font-bold px-2 py-0.5 rounded"
        style={{
          color,
          background: `color-mix(in srgb, ${color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
          minWidth: 36,
          textAlign: "center",
        }}
      >
        #{position.toFixed(0)}
      </div>
      <div
        className="flex-1 h-0.5 rounded-full overflow-hidden"
        style={{ background: "var(--surface-3)", width: 60 }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${proximity * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function LowHangingFruits({ data, isLoading }: LowHangingFruitsProps) {
  return (
    <div className="panel flex flex-col" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="section-title mb-1" style={{ color: "var(--accent-amber)" }}>
          ◆ LOW HANGING FRUITS
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
          Positions 11–20 · Fort potentiel d'ascension
        </p>
      </div>

      {/* Table header */}
      <div
        className="grid px-5 py-2"
        style={{
          gridTemplateColumns: "1fr 100px 80px 60px",
          borderBottom: "1px solid var(--border-dim)",
        }}
      >
        {["MOT-CLÉ", "POSITION", "IMPRES.", "CTR"].map(h => (
          <div key={h} className="label-tag" style={{ fontSize: "9px" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="grid px-5 py-3"
                style={{ gridTemplateColumns: "1fr 100px 80px 60px", borderBottom: "1px solid var(--border-dim)" }}
              >
                <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: "70%" }} />
                <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 60 }} />
                <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 40 }} />
                <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 30 }} />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="label-tag" style={{ color: "var(--text-dim)" }}>AUCUN RÉSULTAT</p>
          </div>
        ) : (
          data.map((row, idx) => (
            <div
              key={idx}
              className="data-row grid px-5 py-3 items-center"
              style={{
                gridTemplateColumns: "1fr 100px 80px 60px",
                borderBottom: "1px solid var(--border-dim)",
              }}
            >
              {/* Keyword */}
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                    row.trafficType === "brand" ? "badge-brand" : "badge-nonbrand"
                  }`}
                >
                  {row.trafficType === "brand" ? "B" : "NB"}
                </span>
                <span
                  className="text-xs truncate"
                  style={{ color: "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
                  title={row.keyword}
                >
                  {row.keyword}
                </span>
              </div>

              {/* Position */}
              <PositionBadge position={row.position} />

              {/* Impressions */}
              <div
                className="metric-number text-xs font-medium"
                style={{ color: "var(--accent-amber)" }}
              >
                {formatNumber(row.impressions)}
              </div>

              {/* CTR */}
              <div
                className="metric-number text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {row.ctr.toFixed(1)}%
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer count */}
      {!isLoading && data.length > 0 && (
        <div
          className="px-5 py-2.5"
          style={{ borderTop: "1px solid var(--border-dim)" }}
        >
          <span className="label-tag" style={{ fontSize: "9px" }}>
            {data.length} OPPORTUNITÉS DÉTECTÉES
          </span>
        </div>
      )}
    </div>
  );
}
