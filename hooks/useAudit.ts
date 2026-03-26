"use client";

import { useState, useCallback } from "react";
import type {
  AuditRow,
  AuditFilter,
  SitemapApiResponse,
  InspectApiResponse,
  IndexApiResponse,
} from "@/lib/types/audit";

const INSPECT_CHUNK = 10;

export function useAudit(siteUrl: string) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [filter, setFilter] = useState<AuditFilter>("all");
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [inspectProgress, setInspectProgress] = useState({ done: 0, total: 0 });
  const [indexProgress, setIndexProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState(false);
  const [sitemapTruncated, setSitemapTruncated] = useState(false);

  // ── Load Sitemap ────────────────────────────────────────
  const loadSitemap = useCallback(async () => {
    setIsLoadingSitemap(true);
    setError(null);
    setRows([]);
    setSitemapTruncated(false);

    try {
      const res = await fetch(
        `/api/audit/sitemap?siteUrl=${encodeURIComponent(siteUrl)}`
      );
      const data: SitemapApiResponse & { error?: string } = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Erreur lors du chargement du sitemap.");
        return;
      }

      setSitemapTruncated(data.truncated);
      setRows(
        data.urls.map((entry) => ({
          ...entry,
          selected: false,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
    } finally {
      setIsLoadingSitemap(false);
    }
  }, [siteUrl]);

  // ── Inspect Selected ────────────────────────────────────
  const inspectSelected = useCallback(async () => {
    const selectedUrls = rows
      .filter((r) => r.selected)
      .map((r) => r.url);

    if (selectedUrls.length === 0) return;

    setIsInspecting(true);
    setError(null);
    setInspectProgress({ done: 0, total: selectedUrls.length });

    let done = 0;
    for (let i = 0; i < selectedUrls.length; i += INSPECT_CHUNK) {
      const chunk = selectedUrls.slice(i, i + INSPECT_CHUNK);
      try {
        const res = await fetch("/api/audit/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: chunk, siteUrl }),
        });
        const data: InspectApiResponse & { error?: string } = await res.json();

        if (!res.ok || data.error) {
          setError(data.error ?? "Erreur lors de l'inspection.");
          break;
        }

        // Merge results into rows
        setRows((prev) =>
          prev.map((row) => {
            const result = data.results.find((r) => r.url === row.url);
            return result ? { ...row, inspection: result } : row;
          })
        );

        done += data.results.length;
        setInspectProgress({ done, total: selectedUrls.length });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
        break;
      }
    }

    setIsInspecting(false);
  }, [rows, siteUrl]);

  // ── Helpers ────────────────────────────────────────────
  function isNonIndexed(coverageState: string): boolean {
    const s = coverageState.toLowerCase();
    return (
      s.includes("not indexed") ||
      s.includes("discovered") ||
      s === "url is unknown to google" ||
      s === "unknown" ||
      s === ""
    );
  }

  // ── Inspect & Auto-Index ─────────────────────────────────
  const [inspectAndIndexStatus, setInspectAndIndexStatus] = useState<string | null>(null);

  const inspectAndIndex = useCallback(async () => {
    const selectedUrls = rows.filter((r) => r.selected).map((r) => r.url);
    if (selectedUrls.length === 0) return;

    setIsInspecting(true);
    setError(null);
    setScopeError(false);
    setInspectAndIndexStatus("Inspection en cours…");
    setInspectProgress({ done: 0, total: selectedUrls.length });

    // ── Phase 1 : inspection ──────────────────────────────
    let updatedRows: AuditRow[] = rows;
    let done = 0;

    for (let i = 0; i < selectedUrls.length; i += INSPECT_CHUNK) {
      const chunk = selectedUrls.slice(i, i + INSPECT_CHUNK);
      try {
        const res = await fetch("/api/audit/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: chunk, siteUrl }),
        });
        const data: InspectApiResponse & { error?: string } = await res.json();

        if (!res.ok || data.error) {
          setError(data.error ?? "Erreur lors de l'inspection.");
          setIsInspecting(false);
          setInspectAndIndexStatus(null);
          return;
        }

        updatedRows = updatedRows.map((row) => {
          const result = data.results.find((r) => r.url === row.url);
          return result ? { ...row, inspection: result } : row;
        });
        setRows(updatedRows);

        done += data.results.length;
        setInspectProgress({ done, total: selectedUrls.length });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
        setIsInspecting(false);
        setInspectAndIndexStatus(null);
        return;
      }
    }

    setIsInspecting(false);

    // ── Phase 2 : soumission des non-indexés ──────────────
    const toIndex = updatedRows
      .filter((r) => r.selected && r.inspection && isNonIndexed(r.inspection.coverageState))
      .map((r) => r.url);

    if (toIndex.length === 0) {
      setInspectAndIndexStatus("Aucune URL à soumettre — toutes déjà indexées.");
      setTimeout(() => setInspectAndIndexStatus(null), 4000);
      return;
    }

    setIsIndexing(true);
    setInspectAndIndexStatus(`Soumission de ${toIndex.length} URL(s) non indexées…`);
    setIndexProgress({ done: 0, total: toIndex.length });

    try {
      const res = await fetch("/api/audit/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: toIndex, siteUrl }),
      });
      const data: IndexApiResponse & { error?: string } = await res.json();

      if (res.status === 403 && data.error === "INDEXING_SCOPE_MISSING") {
        setScopeError(true);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error ?? "Erreur lors de l'indexation.");
        return;
      }

      setRows((prev) =>
        prev.map((row) => {
          const result = data.results.find((r) => r.url === row.url);
          return result ? { ...row, indexing: result } : row;
        })
      );
      setIndexProgress({ done: data.processed, total: toIndex.length });
      setInspectAndIndexStatus(`✓ ${data.processed} URL(s) soumises à Google.`);
      setTimeout(() => setInspectAndIndexStatus(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
    } finally {
      setIsIndexing(false);
    }
  }, [rows, siteUrl]);

  // ── Index Selected ──────────────────────────────────────
  const indexSelected = useCallback(async () => {
    const selectedUrls = rows
      .filter((r) => r.selected)
      .map((r) => r.url);

    if (selectedUrls.length === 0) return;

    setIsIndexing(true);
    setError(null);
    setScopeError(false);
    setIndexProgress({ done: 0, total: selectedUrls.length });

    try {
      const res = await fetch("/api/audit/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: selectedUrls, siteUrl }),
      });
      const data: IndexApiResponse & { error?: string } = await res.json();

      if (res.status === 403 && data.error === "INDEXING_SCOPE_MISSING") {
        setScopeError(true);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error ?? "Erreur lors de l'indexation.");
        return;
      }

      setRows((prev) =>
        prev.map((row) => {
          const result = data.results.find((r) => r.url === row.url);
          return result ? { ...row, indexing: result } : row;
        })
      );
      setIndexProgress({ done: data.processed, total: selectedUrls.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
    } finally {
      setIsIndexing(false);
    }
  }, [rows, siteUrl]);

  // ── Selection helpers ───────────────────────────────────
  const toggleSelect = useCallback((url: string) => {
    setRows((prev) =>
      prev.map((r) => (r.url === url ? { ...r, selected: !r.selected } : r))
    );
  }, []);

  const selectAll = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: false })));
  }, []);

  // ── Filtered rows ───────────────────────────────────────
  const filteredRows = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "non-indexed") {
      const state = r.inspection?.coverageState ?? "";
      return (
        !state.toLowerCase().includes("indexed") ||
        state.toLowerCase().includes("not indexed")
      );
    }
    if (filter === "errors") {
      return (
        r.inspection?.coverageState === "Error" ||
        !!r.inspection?.error ||
        r.indexing?.success === false
      );
    }
    return true;
  });

  const selectedCount = rows.filter((r) => r.selected).length;
  const inspectedCount = rows.filter((r) => r.inspection).length;

  return {
    rows,
    filteredRows,
    filter,
    setFilter,
    isLoadingSitemap,
    isInspecting,
    isIndexing,
    inspectProgress,
    indexProgress,
    error,
    scopeError,
    sitemapTruncated,
    selectedCount,
    inspectedCount,
    loadSitemap,
    inspectSelected,
    indexSelected,
    inspectAndIndex,
    inspectAndIndexStatus,
    toggleSelect,
    selectAll,
    deselectAll,
  };
}
