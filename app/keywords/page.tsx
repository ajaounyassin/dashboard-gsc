"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useSite } from "@/components/layout/SiteContext";
import { LowHangingFruits } from "@/components/dashboard/LowHangingFruits";
import { PageHeader } from "@/components/layout/PageHeader";

export default function KeywordsPage() {
  const { siteUrl } = useSite();
  const { lowHangingFruits, isLoadingKeywords, refetch } = useDashboard(siteUrl);
  return (
    <div className="min-h-screen">
      <PageHeader
        title="MOTS-CLÉS"
        subtitle="Low Hanging Fruits · positions 11–20"
        action={
          <button onClick={refetch} disabled={isLoadingKeywords} className="btn-primary">
            ↻ ACTUALISER
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <LowHangingFruits data={lowHangingFruits} isLoading={isLoadingKeywords} />
      </div>
    </div>
  );
}
