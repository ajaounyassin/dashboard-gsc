"use client";

import { formatNumber } from "@/lib/data/formatters";
import type { CTROpportunity } from "@/lib/types";

interface CTROpportunitiesProps {
  data: CTROpportunity[];
  isLoading: boolean;
}

function CtrBar({ actual, expected }: { actual: number; expected: number }) {
  const scale = Math.max(expected, 20);
  const actualW = Math.min((actual / scale) * 100, 100);
  const expectedW = Math.min((expected / scale) * 100, 100);
  const gap = expected - actual;
  const severity = gap > 10 ? "var(--accent-red)" : gap > 5 ? "var(--accent-amber)" : "var(--accent-green)";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 rounded-full relative" style={{ background: "var(--surface-3)", width: 80 }}>
        {/* Expected marker */}
        <div
          className="absolute top-0 bottom-0 rounded-full opacity-30"
          style={{ left: 0, width: `${expectedW}%`, background: severity }}
        />
        {/* Actual bar */}
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{ left: 0, width: `${actualW}%`, background: "var(--accent-blue)" }}
        />
      </div>
      <div
        className="metric-number text-[10px] w-10 text-right flex-shrink-0"
        style={{ color: "var(--text-muted)" }}
      >
        {actual.toFixed(1)}%
      </div>
    </div>
  );
}

function PotentialGain({ gain }: { gain: number }) {
  const intensity = gain > 100 ? "var(--accent-amber)" : gain > 30 ? "var(--accent-green)" : "var(--text-muted)";
  return (
    <div
      className="metric-number text-sm font-bold text-right"
      style={{ color: intensity }}
    >
      +{formatNumber(gain)}
      <div className="label-tag text-right" style={{ fontSize: "8px", color: "var(--text-dim)" }}>
        clics/mois
      </div>
    </div>
  );
}

export function CTROpportunities({ data, isLoading }: CTROpportunitiesProps) {
  return (
    <div className="panel">
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="section-title mb-1" style={{ color: "var(--accent-amber)" }}>
              ◆ OPPORTUNITÉS CTR
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              Page 1 · CTR réel {"<"} référence par position · Triées par gain potentiel
            </p>
          </div>
          {!isLoading && data.length > 0 && (
            <div
              className="metric-number text-xs px-3 py-1.5 rounded"
              style={{
                background: "rgba(255, 171, 0, 0.08)",
                color: "var(--accent-amber)",
                border: "1px solid rgba(255, 171, 0, 0.15)",
              }}
            >
              +{formatNumber(data.reduce((a, b) => a + b.potentialClicksGain, 0))} clics potentiels
            </div>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div
        className="grid px-5 py-2"
        style={{
          gridTemplateColumns: "1fr 50px 120px 60px 100px",
          borderBottom: "1px solid var(--border-dim)",
        }}
      >
        {["MOT-CLÉ", "POS.", "CTR RÉEL / ATTENDU", "IMPR.", "GAIN"].map(h => (
          <div key={h} className="label-tag" style={{ fontSize: "9px" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      <div className="overflow-auto" style={{ maxHeight: 480 }}>
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid px-5 py-3"
              style={{
                gridTemplateColumns: "1fr 50px 120px 60px 100px",
                borderBottom: "1px solid var(--border-dim)",
              }}
            >
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: "65%" }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 28 }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 90 }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 40 }} />
              <div className="h-3 rounded animate-pulse" style={{ background: "var(--surface-3)", width: 60 }} />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="label-tag" style={{ color: "var(--text-dim)" }}>AUCUNE OPPORTUNITÉ DÉTECTÉE</p>
          </div>
        ) : (
          data.map((row, idx) => (
            <div
              key={idx}
              className="data-row grid px-5 py-3 items-center"
              style={{
                gridTemplateColumns: "1fr 50px 120px 60px 100px",
                borderBottom: "1px solid var(--border-dim)",
              }}
            >
              {/* Keyword */}
              <div className="flex items-center gap-2 min-w-0 pr-3">
                <span className={`inline-block px-1.5 py-0.5 rounded flex-shrink-0 ${
                  row.trafficType === "brand" ? "badge-brand" : "badge-nonbrand"
                }`}>
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
              <div
                className="metric-number text-xs font-bold"
                style={{ color: "var(--accent-blue)" }}
              >
                #{row.position.toFixed(0)}
              </div>

              {/* CTR bar */}
              <div>
                <CtrBar actual={row.ctr} expected={row.expectedCtr} />
                <div className="label-tag" style={{ fontSize: "8px", marginTop: 2, color: "var(--text-dim)" }}>
                  attendu {row.expectedCtr.toFixed(1)}%
                </div>
              </div>

              {/* Impressions */}
              <div
                className="metric-number text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {formatNumber(row.impressions)}
              </div>

              {/* Gain */}
              <PotentialGain gain={row.potentialClicksGain} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
