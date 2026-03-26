"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useSite } from "@/components/layout/SiteContext";
import { LowHangingFruits } from "@/components/dashboard/LowHangingFruits";

export default function KeywordsPage() {
  const { siteUrl } = useSite();
  const { lowHangingFruits, isLoadingKeywords, refetch } = useDashboard(siteUrl);
  return (
    <div className="min-h-screen">
      <div className="px-6 py-4 sticky top-0 z-40" style={{ background: "rgba(8, 12, 18, 0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-sm font-semibold tracking-widest" style={{ fontFamily: "'Oxanium', sans-serif", color: "var(--foreground)" }}>MOTS-CLÉS</h1>
            <div className="label-tag" style={{ fontSize: "9px", marginTop: 2 }}>Low Hanging Fruits · positions 11–20</div>
          </div>
          <button onClick={refetch} disabled={isLoadingKeywords} className="flex items-center gap-2 px-4 py-2 rounded text-xs disabled:opacity-50" style={{ fontFamily: "'Oxanium', sans-serif", letterSpacing: "0.08em", background: "rgba(0, 230, 118, 0.08)", color: "var(--accent-green)", border: "1px solid rgba(0, 230, 118, 0.2)" }}>
            ↻ ACTUALISER
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <LowHangingFruits data={lowHangingFruits} isLoading={isLoadingKeywords} />
      </div>
    </div>
  );
}
