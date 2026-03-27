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

  // ── Inspect & Auto-Index (pipeline parallèle) ────────────
  // Workflow : inspecter 1 URL → si non-indexée, lancer l'indexation en
  // arrière-plan sans attendre → passer immédiatement à l'URL suivante.
  const [inspectAndIndexStatus, setInspectAndIndexStatus] = useState<string | null>(null);

  const inspectAndIndex = useCallback(async () => {
    const selectedUrls = rows.filter((r) => r.selected).map((r) => r.url);
    if (selectedUrls.length === 0) return;

    setIsInspecting(true);
    setIsIndexing(true);
    setError(null);
    setScopeError(false);
    setInspectAndIndexStatus("Inspection + soumission en pipeline…");
    setInspectProgress({ done: 0, total: selectedUrls.length });
    setIndexProgress({ done: 0, total: 0 });

    let inspectDone = 0;
    let indexTotal = 0;
    let indexDone = 0;
    const indexingPromises: Promise<void>[] = [];

    for (const url of selectedUrls) {
      // ── Inspection 1 URL ────────────────────────────────
      try {
        const res = await fetch("/api/audit/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: [url], siteUrl }),
        });
        const data: InspectApiResponse & { error?: string } = await res.json();

        if (!res.ok || data.error) {
          setError(data.error ?? "Erreur lors de l'inspection.");
          break;
        }

        const result = data.results[0];
        setRows((prev) =>
          prev.map((r) => (r.url === url ? { ...r, inspection: result } : r))
        );

        inspectDone++;
        setInspectProgress({ done: inspectDone, total: selectedUrls.length });

        // ── Si non-indexée → indexation en parallèle ────────
        if (result && isNonIndexed(result.coverageState)) {
          indexTotal++;
          setIndexProgress({ done: indexDone, total: indexTotal });

          const p = fetch("/api/audit/index", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: [url], siteUrl }),
          })
            .then(async (r) => {
              const d: IndexApiResponse & { error?: string; firstError?: string } = await r.json();
              if (r.status === 403 && d.error === "INDEXING_SCOPE_MISSING") {
                setScopeError(true);
                return;
              }
              const indexResult = d.results?.[0];
              if (indexResult) {
                setRows((prev) =>
                  prev.map((row) => (row.url === url ? { ...row, indexing: indexResult } : row))
                );
              }
              if (d.firstError) setError(`Échec indexation : ${d.firstError}`);
              indexDone++;
              setIndexProgress({ done: indexDone, total: indexTotal });
            })
            .catch(() => { indexDone++; setIndexProgress({ done: indexDone, total: indexTotal }); });

          indexingPromises.push(p);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
        break;
      }
    }

    setIsInspecting(false);

    // Attendre que toutes les indexations en cours se terminent
    await Promise.allSettled(indexingPromises);
    setIsIndexing(false);

    if (indexTotal === 0) {
      setInspectAndIndexStatus("Aucune URL à soumettre — toutes déjà indexées.");
    } else {
      setInspectAndIndexStatus(`✓ ${indexDone}/${indexTotal} URL(s) soumises à Google.`);
    }
    setTimeout(() => setInspectAndIndexStatus(null), 5000);
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
      const data: IndexApiResponse & { error?: string; firstError?: string } = await res.json();

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

      // Afficher le message d'erreur Google pour diagnostic
      if (data.firstError) {
        setError(`Échec indexation : ${data.firstError}`);
      }
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
