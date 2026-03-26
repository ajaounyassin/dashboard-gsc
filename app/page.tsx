"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useSite } from "@/components/layout/SiteContext";
import { KPICards } from "@/components/dashboard/KPICards";
import { BrandNonBrandChart } from "@/components/dashboard/BrandNonBrandChart";
import { LowHangingFruits } from "@/components/dashboard/LowHangingFruits";
import { WinnersLosers } from "@/components/dashboard/WinnersLosers";
import { CTROpportunities } from "@/components/dashboard/CTROpportunities";

export default function DashboardPage() {
  const { siteUrl } = useSite();
  const {
    overview, lowHangingFruits, ctrOpportunities, winnersLosers,
    isLoadingOverview, isLoadingKeywords, isLoadingPages,
    errors, refetch,
  } = useDashboard(siteUrl);

  const periodLabel = overview?.period
    ? `${overview.period.startDate} → ${overview.period.endDate}`
    : "— chargement...";

  return (
    <div className="min-h-screen">
      <div
        className="px-6 py-4 sticky top-0 z-40"
        style={{
          background: "rgba(8, 12, 18, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-sm font-semibold tracking-widest" style={{ fontFamily: "'Oxanium', sans-serif", color: "var(--foreground)" }}>
              VUE D&apos;ENSEMBLE
            </h1>
            <div className="label-tag" style={{ fontSize: "9px", marginTop: 2 }}>{periodLabel}</div>
          </div>
          <button
            onClick={refetch}
            disabled={isLoadingOverview || isLoadingKeywords || isLoadingPages}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs transition-all disabled:opacity-50"
            style={{ fontFamily: "'Oxanium', sans-serif", letterSpacing: "0.08em", background: "rgba(0, 230, 118, 0.08)", color: "var(--accent-green)", border: "1px solid rgba(0, 230, 118, 0.2)" }}
          >
            <span className={isLoadingOverview ? "animate-spin" : ""} style={{ display: "inline-block" }}>↻</span>
            ACTUALISER
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="rounded p-4 text-xs" style={{ background: "rgba(255, 82, 82, 0.06)", border: "1px solid rgba(255, 82, 82, 0.2)", color: "var(--accent-red)", fontFamily: "'JetBrains Mono', monospace" }}>
            <div className="font-bold mb-1">⚠ ERREUR DE CONNEXION</div>
            {errors.map((e, i) => <div key={i} style={{ opacity: 0.8 }}>{e}</div>)}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        <KPICards data={overview} isLoading={isLoadingOverview} />
        <BrandNonBrandChart data={overview?.brandSplit ?? null} isLoading={isLoadingOverview} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <WinnersLosers data={winnersLosers} isLoading={isLoadingPages} />
          <LowHangingFruits data={lowHangingFruits} isLoading={isLoadingKeywords} />
        </div>
        <CTROpportunities data={ctrOpportunities} isLoading={isLoadingKeywords} />
      </div>
    </div>
  );
}
