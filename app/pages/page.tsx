"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useSite } from "@/components/layout/SiteContext";
import { WinnersLosers } from "@/components/dashboard/WinnersLosers";
import { PageHeader } from "@/components/layout/PageHeader";

export default function PagesPage() {
  const { siteUrl } = useSite();
  const { winnersLosers, isLoadingPages, refetch } = useDashboard(siteUrl);
  return (
    <div className="min-h-screen">
      <PageHeader
        title="PAGES"
        subtitle="Winners & Losers · 30j vs 30j précédents"
        action={
          <button onClick={refetch} disabled={isLoadingPages} className="btn-primary">
            ↻ ACTUALISER
          </button>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <WinnersLosers data={winnersLosers} isLoading={isLoadingPages} />
      </div>
    </div>
  );
}
