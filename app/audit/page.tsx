"use client";

import { useEffect } from "react";
import { useSite } from "@/components/layout/SiteContext";
import { useAudit } from "@/hooks/useAudit";
import type { AuditFilter, AuditRow } from "@/lib/types/audit";

// ── Helpers ──────────────────────────────────────────────

function truncateUrl(url: string, max = 70): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    if (path.length <= max) return path;
    return path.slice(0, max) + "…";
  } catch {
    return url.length > max ? url.slice(0, max) + "…" : url;
  }
}

function coverageBadgeClass(coverageState: string): string {
  const s = coverageState.toLowerCase();
  if (s.includes("error")) return "badge-error";
  if (s === "submitted and indexed" || s === "indexed") return "badge-indexed";
  if (s.includes("crawled")) return "badge-crawled";
  if (s.includes("discovered") || s.includes("not indexed")) return "badge-crawled";
  return "badge-unknown";
}

function coverageLabel(coverageState: string): string {
  const map: Record<string, string> = {
    "Submitted and indexed": "INDEXÉ",
    "Indexed, though blocked by robots.txt": "INDEXÉ (robots)",
    "Crawled - currently not indexed": "CRAWLÉ",
    "Discovered - currently not indexed": "DÉCOUVERT",
    "Page with redirect": "REDIRECT",
    "URL is unknown to Google": "INCONNU",
    "Error": "ERREUR",
    "Unknown": "N/A",
  };
  return map[coverageState] ?? coverageState.toUpperCase().slice(0, 12);
}

// ── Sub-components ────────────────────────────────────────

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 rounded-full" style={{ background: "var(--border-subtle)" }}>
        <div
          className="h-1 rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="label-tag" style={{ fontSize: "9px", color }}>
        {done}/{total}
      </span>
    </div>
  );
}

function ScopeErrorBanner() {
  return (
    <div
      className="rounded px-4 py-3 mb-4"
      style={{
        background: "rgba(255, 171, 0, 0.08)",
        border: "1px solid rgba(255, 171, 0, 0.3)",
      }}
    >
      <div className="flex items-start gap-3">
        <span style={{ color: "var(--accent-amber)", fontSize: "16px" }}>⚠</span>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-amber)", fontFamily: "'Oxanium', sans-serif" }}>
            SCOPE INDEXING MANQUANT
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            L'API Google Indexing n'est pas autorisée pour ce token.
            Ajoutez le scope <code className="px-1 rounded" style={{ background: "rgba(255,171,0,0.1)", color: "var(--accent-amber)" }}>https://www.googleapis.com/auth/indexing</code> puis relancez&nbsp;:
          </p>
          <code
            className="block mt-2 text-xs px-3 py-2 rounded"
            style={{ background: "var(--surface-2)", color: "var(--accent-green)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            node scripts/authorize.mjs
          </code>
          <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
            Puis mettez à jour <strong>GSC_REFRESH_TOKEN</strong> dans vos variables d'environnement Vercel.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuditTableRow({
  row,
  onToggle,
}: {
  row: AuditRow;
  onToggle: (url: string) => void;
}) {
  const insp = row.inspection;
  const idx = row.indexing;

  return (
    <tr
      className="data-row"
      style={{ cursor: "pointer" }}
      onClick={() => onToggle(row.url)}
    >
      {/* Checkbox */}
      <td className="px-3 py-2.5 w-8">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={() => onToggle(row.url)}
          onClick={(e) => e.stopPropagation()}
          className="rounded"
          style={{ accentColor: "var(--accent-green)" }}
        />
      </td>

      {/* URL */}
      <td className="px-3 py-2.5 max-w-xs">
        <span
          className="text-xs"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-muted)" }}
          title={row.url}
        >
          {truncateUrl(row.url)}
        </span>
        {row.lastmod && (
          <div className="label-tag mt-0.5" style={{ fontSize: "8px" }}>
            Lastmod : {row.lastmod}
          </div>
        )}
      </td>

      {/* Statut couverture */}
      <td className="px-3 py-2.5">
        {insp ? (
          <span className={`${coverageBadgeClass(insp.coverageState)} px-2 py-0.5 rounded-sm`}>
            {coverageLabel(insp.coverageState)}
          </span>
        ) : (
          <span className="badge-unknown px-2 py-0.5 rounded-sm">N/A</span>
        )}
        {insp?.error && (
          <div className="label-tag mt-0.5" style={{ fontSize: "8px", color: "var(--accent-red)" }}>
            {insp.error.slice(0, 60)}
          </div>
        )}
      </td>

      {/* Dernier crawl */}
      <td className="px-3 py-2.5">
        {insp?.lastCrawlTime ? (
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
            {insp.lastCrawlTime.slice(0, 10)}
          </span>
        ) : (
          <span className="label-tag" style={{ fontSize: "9px" }}>—</span>
        )}
      </td>

      {/* Indexation soumise */}
      <td className="px-3 py-2.5">
        {idx ? (
          idx.success ? (
            <span className="badge-indexed px-2 py-0.5 rounded-sm">SOUMIS</span>
          ) : (
            <span className="badge-error px-2 py-0.5 rounded-sm">ÉCHEC</span>
          )
        ) : (
          <span className="label-tag" style={{ fontSize: "9px" }}>—</span>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function AuditPage() {
  const { siteUrl } = useSite();
  const {
    filteredRows,
    rows,
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
  } = useAudit(siteUrl);

  // Rechargement automatique quand le site change
  useEffect(() => {
    if (rows.length > 0) {
      loadSitemap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteUrl]);

  const FILTERS: { value: AuditFilter; label: string }[] = [
    { value: "all", label: "TOUT" },
    { value: "non-indexed", label: "NON INDEXÉ" },
    { value: "errors", label: "ERREURS" },
  ];

  const isBusy = isLoadingSitemap || isInspecting || isIndexing;

  return (
    <div className="min-h-screen">
      {/* Header sticky */}
      <div
        className="px-6 py-4 sticky top-0 z-40"
        style={{
          background: "rgba(8, 12, 18, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1
              className="text-sm font-semibold tracking-widest"
              style={{ fontFamily: "'Oxanium', sans-serif", color: "var(--foreground)" }}
            >
              AUDIT & INDEXATION
            </h1>
            <div className="label-tag" style={{ fontSize: "9px", marginTop: 2 }}>
              Sitemap · Inspection · Soumission Google Indexing API
            </div>
          </div>
          <button
            onClick={loadSitemap}
            disabled={isBusy}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs disabled:opacity-50 transition-opacity"
            style={{
              fontFamily: "'Oxanium', sans-serif",
              letterSpacing: "0.08em",
              background: "rgba(0, 230, 118, 0.08)",
              color: "var(--accent-green)",
              border: "1px solid rgba(0, 230, 118, 0.2)",
            }}
          >
            {isLoadingSitemap ? "CHARGEMENT…" : "↓ CHARGER SITEMAP"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Scope error banner */}
        {scopeError && <ScopeErrorBanner />}

        {/* Truncation warning */}
        {sitemapTruncated && (
          <div
            className="rounded px-4 py-2.5 text-xs"
            style={{
              background: "rgba(255, 171, 0, 0.06)",
              border: "1px solid rgba(255, 171, 0, 0.2)",
              color: "var(--accent-amber)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⚠ Sitemap tronqué — seules les 500 premières URLs sont affichées.
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded px-4 py-2.5 text-xs"
            style={{
              background: "rgba(255, 82, 82, 0.06)",
              border: "1px solid rgba(255, 82, 82, 0.2)",
              color: "var(--accent-red)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ✕ {error}
          </div>
        )}

        {/* Progress bars */}
        {isInspecting && inspectProgress.total > 0 && (
          <div className="panel p-4 space-y-2">
            <div className="label-tag" style={{ fontSize: "9px", color: "var(--accent-green)" }}>
              INSPECTION EN COURS…
            </div>
            <ProgressBar
              done={inspectProgress.done}
              total={inspectProgress.total}
              color="var(--accent-green)"
            />
          </div>
        )}

        {isIndexing && indexProgress.total > 0 && (
          <div className="panel p-4 space-y-2">
            <div className="label-tag" style={{ fontSize: "9px", color: "var(--accent-amber)" }}>
              INDEXATION EN COURS…
            </div>
            <ProgressBar
              done={indexProgress.done}
              total={indexProgress.total}
              color="var(--accent-amber)"
            />
          </div>
        )}

        {rows.length === 0 && !isLoadingSitemap && (
          <div
            className="panel flex flex-col items-center justify-center py-20 text-center"
          >
            <div
              className="text-3xl mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--border-subtle)" }}
            >
              []
            </div>
            <div
              className="section-title mb-2"
              style={{ fontSize: "11px" }}
            >
              SITEMAP NON CHARGÉ
            </div>
            <div className="label-tag" style={{ fontSize: "9px" }}>
              Cliquez sur "CHARGER SITEMAP" pour démarrer l'audit
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="panel overflow-hidden">
            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-wrap gap-3"
              style={{ borderBottom: "1px solid var(--border-dim)" }}
            >
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div>
                  <span className="metric-number text-sm">{rows.length}</span>
                  <span className="label-tag ml-1.5" style={{ fontSize: "8px" }}>URLS</span>
                </div>
                <div>
                  <span className="metric-number text-sm">{inspectedCount}</span>
                  <span className="label-tag ml-1.5" style={{ fontSize: "8px" }}>INSPECTÉES</span>
                </div>
                <div>
                  <span className="metric-number text-sm" style={{ color: "var(--accent-green)" }}>
                    {selectedCount}
                  </span>
                  <span className="label-tag ml-1.5" style={{ fontSize: "8px" }}>SÉLECTIONNÉES</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="px-3 py-1.5 rounded text-xs transition-all"
                    style={{
                      fontFamily: "'Oxanium', sans-serif",
                      letterSpacing: "0.07em",
                      fontSize: "9px",
                      background:
                        filter === f.value ? "rgba(0, 230, 118, 0.1)" : "transparent",
                      color:
                        filter === f.value ? "var(--accent-green)" : "var(--text-dim)",
                      border:
                        filter === f.value
                          ? "1px solid rgba(0, 230, 118, 0.25)"
                          : "1px solid transparent",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={selectAll}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-40"
                  style={{
                    fontFamily: "'Oxanium', sans-serif",
                    fontSize: "9px",
                    letterSpacing: "0.07em",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-dim)",
                  }}
                >
                  TOUT SÉLECTIONNER
                </button>
                <button
                  onClick={deselectAll}
                  disabled={isBusy}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-40"
                  style={{
                    fontFamily: "'Oxanium', sans-serif",
                    fontSize: "9px",
                    letterSpacing: "0.07em",
                    background: "rgba(255,255,255,0.04)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-dim)",
                  }}
                >
                  DÉSÉLECTIONNER
                </button>
                <button
                  onClick={inspectSelected}
                  disabled={isBusy || selectedCount === 0}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-40 transition-opacity"
                  style={{
                    fontFamily: "'Oxanium', sans-serif",
                    fontSize: "9px",
                    letterSpacing: "0.07em",
                    background: "rgba(0, 230, 118, 0.08)",
                    color: "var(--accent-green)",
                    border: "1px solid rgba(0, 230, 118, 0.2)",
                  }}
                >
                  {isInspecting ? "INSPECTION…" : `🔍 INSPECTER (${selectedCount})`}
                </button>
                <button
                  onClick={indexSelected}
                  disabled={isBusy || selectedCount === 0}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-40 transition-opacity"
                  style={{
                    fontFamily: "'Oxanium', sans-serif",
                    fontSize: "9px",
                    letterSpacing: "0.07em",
                    background: "rgba(255, 171, 0, 0.08)",
                    color: "var(--accent-amber)",
                    border: "1px solid rgba(255, 171, 0, 0.2)",
                  }}
                >
                  {isIndexing ? "SOUMISSION…" : `↑ SOUMETTRE (${selectedCount})`}
                </button>
                <button
                  onClick={inspectAndIndex}
                  disabled={isBusy || selectedCount === 0}
                  className="px-3 py-1.5 rounded text-xs disabled:opacity-40 transition-opacity"
                  style={{
                    fontFamily: "'Oxanium', sans-serif",
                    fontSize: "9px",
                    letterSpacing: "0.07em",
                    background: "rgba(100, 220, 255, 0.08)",
                    color: "#64dcff",
                    border: "1px solid rgba(100, 220, 255, 0.2)",
                  }}
                >
                  {isBusy && inspectAndIndexStatus
                    ? inspectAndIndexStatus.toUpperCase().slice(0, 20) + "…"
                    : `⚡ INSPECTER + SOUMETTRE (${selectedCount})`}
                </button>
              </div>
            </div>
            {/* Statut inspectAndIndex */}
            {inspectAndIndexStatus && !isBusy && (
              <div
                className="px-4 py-2 text-xs"
                style={{
                  borderTop: "1px solid var(--border-dim)",
                  color: inspectAndIndexStatus.startsWith("✓") ? "var(--accent-green)" : "var(--accent-amber)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {inspectAndIndexStatus}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                    <th className="px-3 py-2.5 text-left w-8" />
                    <th
                      className="px-3 py-2.5 text-left label-tag"
                      style={{ fontSize: "8px" }}
                    >
                      URL
                    </th>
                    <th
                      className="px-3 py-2.5 text-left label-tag"
                      style={{ fontSize: "8px" }}
                    >
                      COUVERTURE
                    </th>
                    <th
                      className="px-3 py-2.5 text-left label-tag"
                      style={{ fontSize: "8px" }}
                    >
                      DERNIER CRAWL
                    </th>
                    <th
                      className="px-3 py-2.5 text-left label-tag"
                      style={{ fontSize: "8px" }}
                    >
                      SOUMISSION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <AuditTableRow
                      key={row.url}
                      row={row}
                      onToggle={toggleSelect}
                    />
                  ))}
                </tbody>
              </table>
              {filteredRows.length === 0 && (
                <div
                  className="py-12 text-center label-tag"
                  style={{ fontSize: "9px" }}
                >
                  Aucune URL pour ce filtre.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
