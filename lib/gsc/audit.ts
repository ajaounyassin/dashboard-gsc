// ============================================================
// Logique serveur — Audit & Indexation en masse
// ============================================================

import { XMLParser } from "fast-xml-parser";
import { google } from "googleapis";
import { getGSCAuthClient, getSearchConsoleClient } from "@/lib/gsc/client";
import type { SitemapEntry, InspectionResult, IndexingResultItem } from "@/lib/types/audit";

// ── Helpers ────────────────────────────────────────────────

/**
 * Convertit une propriété GSC en URL de base navigable.
 *   sc-domain:example.fr  →  https://example.fr
 *   https://example.fr/   →  https://example.fr/
 */
export function siteUrlToBaseUrl(siteUrl: string): string {
  if (siteUrl.startsWith("sc-domain:")) {
    return `https://${siteUrl.slice("sc-domain:".length)}`;
  }
  return siteUrl;
}

/**
 * Retourne la propriété sc-domain: à utiliser pour l'API URL Inspection.
 * L'API exige que siteUrl soit la propriété GSC qui CONTIENT l'URL inspectée.
 * sc-domain: couvre toutes les variantes (www, https, http) → toujours préféré.
 *   sc-domain:example.fr      →  sc-domain:example.fr (inchangé)
 *   https://www.example.fr/   →  sc-domain:example.fr
 *   https://example.fr/       →  sc-domain:example.fr
 */
export function toScDomainProperty(siteUrl: string): string {
  if (siteUrl.startsWith("sc-domain:")) return siteUrl;
  try {
    const { hostname } = new URL(siteUrl);
    // Retirer le préfixe www. si présent
    const domain = hostname.replace(/^www\./, "");
    return `sc-domain:${domain}`;
  } catch {
    return siteUrl;
  }
}

// ── Sitemap ────────────────────────────────────────────────

const SITEMAP_CAP = 500;
const SITEMAP_INDEX_MAX_CHILDREN = 10;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

async function fetchSitemapUrls(sitemapUrl: string): Promise<SitemapEntry[]> {
  const res = await fetch(sitemapUrl, {
    headers: { "User-Agent": "GSC-Dashboard-Bot/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${sitemapUrl}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);

  // Sitemap index
  if (parsed.sitemapindex) {
    const sitemaps = parsed.sitemapindex.sitemap;
    const children: { loc: string }[] = Array.isArray(sitemaps) ? sitemaps : [sitemaps];
    const entries: SitemapEntry[] = [];
    for (const child of children.slice(0, SITEMAP_INDEX_MAX_CHILDREN)) {
      if (!child?.loc) continue;
      try {
        const sub = await fetchSitemapUrls(child.loc);
        entries.push(...sub);
        if (entries.length >= SITEMAP_CAP) break;
      } catch {
        // skip enfant inaccessible
      }
    }
    return entries;
  }

  // Sitemap standard
  if (parsed.urlset) {
    const urls = parsed.urlset.url;
    if (!urls) return [];
    const list: { loc: string; lastmod?: string }[] = Array.isArray(urls) ? urls : [urls];
    return list
      .filter((u) => u?.loc)
      .map((u) => ({ url: u.loc, lastmod: u.lastmod ?? undefined }));
  }

  return [];
}

/**
 * Récupère les URLs du sitemap principal d'une propriété GSC.
 * Cap à 500 URLs, gère les sitemap index (profondeur 1, max 10 enfants).
 */
export async function fetchSitemap(
  siteUrl: string
): Promise<{ entries: SitemapEntry[]; truncated: boolean; totalCount: number }> {
  const baseUrl = siteUrlToBaseUrl(siteUrl).replace(/\/$/, "");
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  const entries = await fetchSitemapUrls(sitemapUrl);
  const truncated = entries.length > SITEMAP_CAP;
  const sliced = entries.slice(0, SITEMAP_CAP);

  return { entries: sliced, truncated, totalCount: entries.length };
}

// ── Inspection ─────────────────────────────────────────────

const INSPECT_DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Inspecte une URL via l'API URL Inspection de Search Console.
 */
export async function inspectUrl(
  inspectionUrl: string,
  siteUrl: string
): Promise<InspectionResult> {
  try {
    const sc = getSearchConsoleClient();
    // Toujours utiliser sc-domain: pour l'inspection — couvre www/non-www/http/https
    const inspectionSiteUrl = toScDomainProperty(siteUrl);
    const res = await sc.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl,
        siteUrl: inspectionSiteUrl,
      },
    });

    const result = res.data.inspectionResult;
    const index = result?.indexStatusResult;

    return {
      url: inspectionUrl,
      coverageState: index?.coverageState ?? "Unknown",
      indexingState: index?.indexingState ?? "Unknown",
      robotsTxtState: index?.robotsTxtState ?? "Unknown",
      lastCrawlTime: index?.lastCrawlTime ?? undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      url: inspectionUrl,
      coverageState: "Error",
      indexingState: "Error",
      robotsTxtState: "Unknown",
      error: msg,
    };
  }
}

/**
 * Inspecte un lot d'URLs séquentiellement avec délai de 500ms entre chaque.
 * Destiné à être appelé depuis la route API (max 50 URLs par appel).
 */
export async function inspectUrls(
  urls: string[],
  siteUrl: string
): Promise<InspectionResult[]> {
  const results: InspectionResult[] = [];
  for (let i = 0; i < urls.length; i++) {
    if (i > 0) await sleep(INSPECT_DELAY_MS);
    const result = await inspectUrl(urls[i], siteUrl);
    results.push(result);
  }
  return results;
}

// ── Indexing ───────────────────────────────────────────────

const INDEXING_CAP = 200;

/**
 * Soumet une URL à l'API Google Indexing.
 * Requiert le scope https://www.googleapis.com/auth/indexing.
 */
export async function requestIndexing(url: string): Promise<IndexingResultItem> {
  try {
    const auth = getGSCAuthClient();
    const indexing = google.indexing({ version: "v3", auth });

    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type: "URL_UPDATED",
      },
    });

    return {
      url,
      success: true,
      notifyTime: res.data.urlNotificationMetadata?.latestUpdate?.notifyTime ?? undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return { url, success: false, error: msg };
  }
}

/**
 * Soumet un lot d'URLs à l'indexation, cap à 200.
 */
export async function requestIndexingBatch(urls: string[]): Promise<IndexingResultItem[]> {
  const capped = urls.slice(0, INDEXING_CAP);
  const results: IndexingResultItem[] = [];
  for (const url of capped) {
    const result = await requestIndexing(url);
    results.push(result);
  }
  return results;
}
