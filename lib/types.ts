// ============================================================
// Types globaux du Dashboard GSC
// ============================================================

export interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCApiResponse {
  rows?: GSCRow[];
}

// --- Brand / Non-Brand ---

export type TrafficType = "brand" | "non-brand";

export interface BrandSplit {
  brand: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  nonBrand: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  totalClicks: number;
  totalImpressions: number;
  brandShareClicks: number;    // en %
  brandShareImpressions: number; // en %
}

// --- KPI Overview ---

export interface KPIOverview {
  period: {
    startDate: string;
    endDate: string;
  };
  totals: {
    clicks: number;
    impressions: number;
    avgCtr: number;
    avgPosition: number;
  };
  brandSplit: BrandSplit;
}

// --- Low Hanging Fruits ---

export interface LowHangingFruit {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  trafficType: TrafficType;
}

// --- Winners & Losers ---

export interface PagePerformance {
  page: string;
  currentClicks: number;
  previousClicks: number;
  deltaClicks: number;
  deltaPercent: number;
  currentImpressions: number;
  currentCtr: number;
  currentPosition: number;
}

export interface WinnersLosers {
  winners: PagePerformance[];
  losers: PagePerformance[];
  period: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
}

// --- CTR Opportunities ---

export interface CTROpportunity {
  keyword: string;
  position: number;
  ctr: number;
  expectedCtr: number;   // CTR théorique selon la position
  ctrGap: number;        // expectedCtr - ctr (en points de %)
  impressions: number;
  clicks: number;
  potentialClicksGain: number; // impressions * ctrGap
  trafficType: TrafficType;
}

// --- Réponses API ---

export interface OverviewApiResponse {
  overview: KPIOverview;
}

export interface KeywordsApiResponse {
  lowHangingFruits: LowHangingFruit[];
  ctrOpportunities: CTROpportunity[];
}

export interface PagesApiResponse {
  winnersLosers: WinnersLosers;
}

// --- Paramètres de requête ---

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
