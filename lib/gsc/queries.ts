// ============================================================
// Builders de requêtes GSC — centralisés et typés
// ============================================================

import { google, Auth } from "googleapis";
import type { GSCRow } from "@/lib/types";

export interface QueryOptions {
  startDate: string;
  endDate: string;
  dimensions: ("query" | "page" | "device" | "country")[];
  rowLimit?: number;
  startRow?: number;
  siteUrl: string;
}

export async function queryGSC(auth: Auth.OAuth2Client, options: QueryOptions): Promise<GSCRow[]> {
  const sc = google.searchconsole({ version: "v1", auth });
  const rowLimit = options.rowLimit ?? 5000;

  const response = await sc.searchanalytics.query({
    siteUrl: options.siteUrl,
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

export async function queryGSCAll(auth: Auth.OAuth2Client, options: QueryOptions): Promise<GSCRow[]> {
  const PAGE_SIZE = 25000;
  const allRows: GSCRow[] = [];
  let startRow = 0;

  while (true) {
    const rows = await queryGSC(auth, { ...options, rowLimit: PAGE_SIZE, startRow });
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    startRow += PAGE_SIZE;
  }

  return allRows;
}

export async function getKeywordData(
  auth: Auth.OAuth2Client,
  startDate: string,
  endDate: string,
  siteUrl: string
): Promise<GSCRow[]> {
  return queryGSCAll(auth, { startDate, endDate, dimensions: ["query"], siteUrl });
}

export async function getPageData(
  auth: Auth.OAuth2Client,
  startDate: string,
  endDate: string,
  siteUrl: string
): Promise<GSCRow[]> {
  return queryGSCAll(auth, { startDate, endDate, dimensions: ["page"], siteUrl });
}
