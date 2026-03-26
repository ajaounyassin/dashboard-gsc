// ============================================================
// Builders de requêtes GSC — centralisés et typés
// ============================================================

import { getSearchConsoleClient, getSiteUrl } from "./client";
import type { GSCRow } from "@/lib/types";

export interface QueryOptions {
  startDate: string;
  endDate: string;
  dimensions: ("query" | "page" | "device" | "country")[];
  rowLimit?: number;
  startRow?: number;
  siteUrl?: string; // override dynamique
}

export async function queryGSC(options: QueryOptions): Promise<GSCRow[]> {
  const sc = getSearchConsoleClient();
  const siteUrl = getSiteUrl(options.siteUrl);
  const rowLimit = options.rowLimit ?? 5000;

  const response = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: options.startDate,
      endDate: options.endDate,
      dimensions: options.dimensions,
      rowLimit,
      startRow: options.startRow ?? 0,
      dataState: "all",
    },
  });

  return (response.data.rows ?? []) as GSCRow[];
}

export async function queryGSCAll(options: QueryOptions): Promise<GSCRow[]> {
  const PAGE_SIZE = 25000;
  const allRows: GSCRow[] = [];
  let startRow = 0;

  while (true) {
    const rows = await queryGSC({ ...options, rowLimit: PAGE_SIZE, startRow });
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    startRow += PAGE_SIZE;
  }

  return allRows;
}

export async function getKeywordData(
  startDate: string,
  endDate: string,
  siteUrl?: string
): Promise<GSCRow[]> {
  return queryGSCAll({ startDate, endDate, dimensions: ["query"], siteUrl });
}

export async function getPageData(
  startDate: string,
  endDate: string,
  siteUrl?: string
): Promise<GSCRow[]> {
  return queryGSCAll({ startDate, endDate, dimensions: ["page"], siteUrl });
}
