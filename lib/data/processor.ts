// ============================================================
// Traitement, agrégation et enrichissement des données GSC
// ============================================================

import { isBrandKeyword } from "@/lib/gsc/brand";
import type {
  GSCRow,
  BrandSplit,
  KPIOverview,
  LowHangingFruit,
  PagePerformance,
  WinnersLosers,
  CTROpportunity,
  TrafficType,
} from "@/lib/types";

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function safePct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100; // 2 décimales
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sumField(rows: GSCRow[], field: "clicks" | "impressions"): number {
  return rows.reduce((acc, r) => acc + (r[field] ?? 0), 0);
}

function weightedAvgPosition(rows: GSCRow[]): number {
  const totalImpressions = sumField(rows, "impressions");
  if (totalImpressions === 0) return 0;
  const weighted = rows.reduce(
    (acc, r) => acc + r.position * (r.impressions ?? 0),
    0
  );
  return Math.round((weighted / totalImpressions) * 10) / 10;
}

function weightedAvgCtr(rows: GSCRow[]): number {
  const totalImpressions = sumField(rows, "impressions");
  if (totalImpressions === 0) return 0;
  const weighted = rows.reduce(
    (acc, r) => acc + r.ctr * (r.impressions ?? 0),
    0
  );
  return Math.round((weighted / totalImpressions) * 10000) / 10000; // 4 décimales
}

// -------------------------------------------------------
// CTR théorique par position (courbe CTR industry average)
// Source : études Sistrix / Advanced Web Ranking
// -------------------------------------------------------

const EXPECTED_CTR_BY_POSITION: Record<number, number> = {
  1: 0.28,
  2: 0.15,
  3: 0.11,
  4: 0.08,
  5: 0.06,
  6: 0.05,
  7: 0.04,
  8: 0.034,
  9: 0.03,
  10: 0.025,
};

function getExpectedCtr(position: number): number {
  const pos = Math.round(position);
  if (pos <= 1) return EXPECTED_CTR_BY_POSITION[1];
  if (pos >= 10) return EXPECTED_CTR_BY_POSITION[10];
  return EXPECTED_CTR_BY_POSITION[pos] ?? 0.025;
}

// -------------------------------------------------------
// Calcul Brand Split
// -------------------------------------------------------

export function computeBrandSplit(rows: GSCRow[], brandRegex: RegExp): BrandSplit {
  const brandRows = rows.filter((r) => isBrandKeyword(r.keys?.[0] ?? "", brandRegex));
  const nonBrandRows = rows.filter((r) => !isBrandKeyword(r.keys?.[0] ?? "", brandRegex));

  const brandClicks = sumField(brandRows, "clicks");
  const nonBrandClicks = sumField(nonBrandRows, "clicks");
  const brandImpressions = sumField(brandRows, "impressions");
  const nonBrandImpressions = sumField(nonBrandRows, "impressions");
  const totalClicks = brandClicks + nonBrandClicks;
  const totalImpressions = brandImpressions + nonBrandImpressions;

  return {
    brand: {
      clicks: brandClicks,
      impressions: brandImpressions,
      ctr: weightedAvgCtr(brandRows),
      position: weightedAvgPosition(brandRows),
    },
    nonBrand: {
      clicks: nonBrandClicks,
      impressions: nonBrandImpressions,
      ctr: weightedAvgCtr(nonBrandRows),
      position: weightedAvgPosition(nonBrandRows),
    },
    totalClicks,
    totalImpressions,
    brandShareClicks: safePct(brandClicks, totalClicks),
    brandShareImpressions: safePct(brandImpressions, totalImpressions),
  };
}

// -------------------------------------------------------
// KPI Overview
// -------------------------------------------------------

export function computeOverview(
  rows: GSCRow[],
  period: { startDate: string; endDate: string },
  brandRegex: RegExp
): KPIOverview {
  const totalClicks = sumField(rows, "clicks");
  const totalImpressions = sumField(rows, "impressions");

  return {
    period,
    totals: {
      clicks: totalClicks,
      impressions: totalImpressions,
      avgCtr: weightedAvgCtr(rows),
      avgPosition: weightedAvgPosition(rows),
    },
    brandSplit: computeBrandSplit(rows, brandRegex),
  };
}

// -------------------------------------------------------
// Low Hanging Fruits (positions 11–20, fortes impressions)
// -------------------------------------------------------

/**
 * Seuil adaptatif : 0.5% du total des impressions, minimum 1.
 * Sur un site à 10 000 impr → seuil 50. Sur 100 impr → seuil 1.
 */
function adaptiveMinImpressions(totalImpressions: number, pct = 0.005): number {
  return Math.max(1, Math.floor(totalImpressions * pct));
}

export function computeLowHangingFruits(
  rows: GSCRow[],
  brandRegex: RegExp,
  limit = 50
): LowHangingFruit[] {
  const totalImpressions = sumField(rows, "impressions");
  const minImpr = adaptiveMinImpressions(totalImpressions);

  return rows
    .filter(
      (r) =>
        r.position >= 11 &&
        r.position <= 20 &&
        r.impressions >= minImpr
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((r) => {
      const keyword = r.keys?.[0] ?? "";
      return {
        keyword,
        position: Math.round(r.position * 10) / 10,
        impressions: r.impressions,
        clicks: r.clicks,
        ctr: Math.round(r.ctr * 10000) / 100,
        trafficType: (isBrandKeyword(keyword, brandRegex) ? "brand" : "non-brand") as TrafficType,
      };
    });
}

// -------------------------------------------------------
// Winners & Losers (comparaison deux périodes)
// -------------------------------------------------------

export function computeWinnersLosers(
  currentRows: GSCRow[],
  previousRows: GSCRow[],
  periods: { current: { start: string; end: string }; previous: { start: string; end: string } },
  limit = 10
): WinnersLosers {
  // Indexer les données précédentes par page
  const prevMap = new Map<string, GSCRow>();
  for (const r of previousRows) {
    prevMap.set(r.keys?.[0] ?? "", r);
  }

  const performances: PagePerformance[] = [];

  for (const curr of currentRows) {
    const page = curr.keys?.[0] ?? "";
    const prev = prevMap.get(page);
    const prevClicks = prev?.clicks ?? 0;
    const delta = curr.clicks - prevClicks;
    const deltaPercent =
      prevClicks === 0
        ? curr.clicks > 0 ? 100 : 0
        : Math.round((delta / prevClicks) * 1000) / 10;

    performances.push({
      page,
      currentClicks: curr.clicks,
      previousClicks: prevClicks,
      deltaClicks: delta,
      deltaPercent,
      currentImpressions: curr.impressions,
      currentCtr: Math.round(curr.ctr * 10000) / 100,
      currentPosition: Math.round(curr.position * 10) / 10,
    });
  }

  const sorted = performances.sort((a, b) => b.deltaClicks - a.deltaClicks);

  return {
    winners: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse(),
    period: periods,
  };
}

// -------------------------------------------------------
// CTR Opportunities (page 1, CTR anormalement bas)
// -------------------------------------------------------

const MIN_CTR_GAP = 0.005; // au moins 0.5 point d'écart (décimal)

export function computeCTROpportunities(
  rows: GSCRow[],
  brandRegex: RegExp,
  limit = 30
): CTROpportunity[] {
  const totalImpressions = sumField(rows, "impressions");
  const minImpr = adaptiveMinImpressions(totalImpressions);

  return rows
    .filter(
      (r) =>
        r.position >= 1 &&
        r.position <= 10 &&
        r.impressions >= minImpr
    )
    .map((r) => {
      const keyword = r.keys?.[0] ?? "";
      const expectedCtr = getExpectedCtr(r.position);
      const ctrGap = expectedCtr - r.ctr;
      return {
        keyword,
        position: Math.round(r.position * 10) / 10,
        ctr: Math.round(r.ctr * 10000) / 100,
        expectedCtr: Math.round(expectedCtr * 10000) / 100,
        ctrGap: Math.round(ctrGap * 10000) / 100,
        impressions: r.impressions,
        clicks: r.clicks,
        potentialClicksGain: Math.round(r.impressions * ctrGap),
        trafficType: (isBrandKeyword(keyword, brandRegex) ? "brand" : "non-brand") as TrafficType,
      };
    })
    .filter((r) => r.ctrGap >= MIN_CTR_GAP * 100) // ctrGap est en %
    .sort((a, b) => b.potentialClicksGain - a.potentialClicksGain)
    .slice(0, limit);
}
