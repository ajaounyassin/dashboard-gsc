"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useSite } from "@/components/layout/SiteContext";
import { CTROpportunities } from "@/components/dashboard/CTROpportunities";
import { PageHeader } from "@/components/layout/PageHeader";

export default function OpportunitiesPage() {
  const { siteUrl } = useSite();
  const { ctrOpportunities, isLoadingKeywords, refetch } = useDashboard(siteUrl);
  return (
    <div className="min-h-screen">
      <PageHeader
        title="OPPORTUNITÉS CTR"
        subtitle="Page 1 · CTR sous la moyenne de position"
        action={
          <button onClick={refetch} disabled={isLoadingKeywords} className="btn-primary">
            ↻ ACTUALISER
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <CTROpportunities data={ctrOpportunities} isLoading={isLoadingKeywords} />
      </div>
    </div>
  );
}
