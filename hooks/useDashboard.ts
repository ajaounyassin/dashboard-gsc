"use client";

import { useState, useEffect, useCallback } from "react";
import type { KPIOverview, LowHangingFruit, WinnersLosers, CTROpportunity } from "@/lib/types";
import { format, subDays } from "date-fns";
import { DEFAULT_SITE } from "@/lib/sites";

interface DashboardState {
  overview: KPIOverview | null;
  lowHangingFruits: LowHangingFruit[];
  ctrOpportunities: CTROpportunity[];
  winnersLosers: WinnersLosers | null;
  isLoadingOverview: boolean;
  isLoadingKeywords: boolean;
  isLoadingPages: boolean;
  errors: string[];
}

const defaultEnd = () => format(subDays(new Date(), 3), "yyyy-MM-dd");
const defaultStart = () => format(subDays(new Date(), 32), "yyyy-MM-dd");

export function useDashboard(
  siteUrl = DEFAULT_SITE.value,
  startDate = defaultStart(),
  endDate = defaultEnd()
) {
  const [state, setState] = useState<DashboardState>({
    overview: null,
    lowHangingFruits: [],
    ctrOpportunities: [],
    winnersLosers: null,
    isLoadingOverview: true,
    isLoadingKeywords: true,
    isLoadingPages: true,
    errors: [],
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoadingOverview: true,
      isLoadingKeywords: true,
      isLoadingPages: true,
      errors: [],
    }));

    const params = new URLSearchParams({ startDate, endDate, siteUrl });

    const [overviewRes, keywordsRes, pagesRes] = await Promise.allSettled([
      fetch(`/api/gsc/overview?${params}`).then((r) => r.json()),
      fetch(`/api/gsc/keywords?${params}`).then((r) => r.json()),
      fetch(`/api/gsc/pages?${params}`).then((r) => r.json()),
    ]);

    const errors: string[] = [];

    const overview =
      overviewRes.status === "fulfilled" && !overviewRes.value.error
        ? overviewRes.value.overview : null;
    if (overviewRes.status === "rejected" || (overviewRes.status === "fulfilled" && overviewRes.value?.error))
      errors.push(`Overview : ${overviewRes.status === "rejected" ? overviewRes.reason : overviewRes.value.error}`);

    const lowHangingFruits =
      keywordsRes.status === "fulfilled" && !keywordsRes.value.error
        ? keywordsRes.value.lowHangingFruits ?? [] : [];
    const ctrOpportunities =
      keywordsRes.status === "fulfilled" && !keywordsRes.value.error
        ? keywordsRes.value.ctrOpportunities ?? [] : [];
    if (keywordsRes.status === "rejected" || (keywordsRes.status === "fulfilled" && keywordsRes.value?.error))
      errors.push(`Keywords : ${keywordsRes.status === "rejected" ? keywordsRes.reason : keywordsRes.value.error}`);

    const winnersLosers =
      pagesRes.status === "fulfilled" && !pagesRes.value.error
        ? pagesRes.value.winnersLosers : null;
    if (pagesRes.status === "rejected" || (pagesRes.status === "fulfilled" && pagesRes.value?.error))
      errors.push(`Pages : ${pagesRes.status === "rejected" ? pagesRes.reason : pagesRes.value.error}`);

    setState({
      overview, lowHangingFruits, ctrOpportunities, winnersLosers,
      isLoadingOverview: false, isLoadingKeywords: false, isLoadingPages: false,
      errors,
    });
  }, [siteUrl, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...state, refetch: fetchData };
}
