// ============================================================
// Types pour la fonctionnalité Audit & Indexation
// ============================================================

export interface SitemapEntry {
  url: string;
  lastmod?: string;
}

export interface SitemapApiResponse {
  urls: SitemapEntry[];
  truncated: boolean;
  totalCount: number;
}

export interface InspectionResult {
  url: string;
  coverageState: string;   // "Indexed" | "Crawled - currently not indexed" | "Discovered - currently not indexed" | etc.
  indexingState: string;   // "INDEXING_ALLOWED" | "BLOCKED_BY_META_TAG" | etc.
  robotsTxtState: string;  // "ALLOWED" | "DISALLOWED"
  lastCrawlTime?: string;
  error?: string;
}

export interface InspectApiResponse {
  results: InspectionResult[];
  processed: number;
  total: number;
}

export interface IndexingResultItem {
  url: string;
  success: boolean;
  error?: string;
  notifyTime?: string;
}

export interface IndexApiResponse {
  results: IndexingResultItem[];
  processed: number;
  total: number;
}

export type AuditFilter = "all" | "non-indexed" | "errors";

export interface AuditRow extends SitemapEntry {
  selected: boolean;
  inspection?: InspectionResult;
  indexing?: IndexingResultItem;
}
