"use client";

import { useEffect, useState } from "react";
import { useSite } from "@/components/layout/SiteContext";

interface UsageData {
  inspections: number;
  indexations: number;
}

interface PlanData {
  plan: "free" | "pro";
}

const FREE_LIMITS = { inspections: 20, indexations: 5 };
const PRO_LIMITS = { inspections: 2000, indexations: 200 };

// Quotas réels Google (indépendants du plan)
const GOOGLE_LIMITS = {
  inspections: 2000,  // URL Inspection API — par projet Google Cloud (partagé)
  indexations: 200,   // Indexing API — par compte Google de l'utilisateur
};

function UsageBar({
  used,
  appLimit,
  googleLimit,
  label,
  color,
  note,
}: {
  used: number;
  appLimit: number;
  googleLimit: number;
  label: string;
  color: string;
  note: string;
}) {
  const pctApp = Math.min(100, Math.round((used / appLimit) * 100));
  const pctGoogle = Math.min(100, Math.round((used / googleLimit) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="label-tag" style={{ fontSize: "9px" }}>{label}</span>
        <span className="label-tag" style={{ fontSize: "9px", color: "var(--text-dim)" }}>
          {used} utilisées aujourd'hui
        </span>
      </div>
      {/* Limite app */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "8px", color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
            Limite Ranklit
          </span>
          <span style={{ fontSize: "8px", color }}>{used} / {appLimit}</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: "var(--border-subtle)" }}>
          <div className="h-1 rounded-full transition-all" style={{ width: `${pctApp}%`, background: color }} />
        </div>
      </div>
      {/* Limite Google */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: "8px", color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
            Quota Google
          </span>
          <span style={{ fontSize: "8px", color: "var(--text-dim)" }}>{used} / {googleLimit}</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: "var(--border-subtle)" }}>
          <div className="h-1 rounded-full transition-all" style={{ width: `${pctGoogle}%`, background: "var(--text-dim)" }} />
        </div>
        <div style={{ fontSize: "8px", color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace" }}>
          {note}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { siteUrl, sites, isLoading: sitesLoading } = useSite();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/usage").then((r) => r.json()),
      fetch("/api/settings/plan").then((r) => r.json()),
    ])
      .then(([u, p]) => {
        setUsage(u.usage ?? null);
        setPlan(p.plan ? { plan: p.plan } : null);
      })
      .catch(console.error)
      .finally(() => setLoadingUsage(false));
  }, []);

  const limits = plan?.plan === "pro" ? PRO_LIMITS : FREE_LIMITS;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="px-6 py-4 sticky top-0 z-40"
        style={{
          background: "rgba(8, 12, 18, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <h1
          className="text-sm font-semibold tracking-widest"
          style={{ fontFamily: "'Oxanium', sans-serif", color: "var(--foreground)" }}
        >
          RÉGLAGES
        </h1>
        <div className="label-tag" style={{ fontSize: "9px", marginTop: 2 }}>
          Plan · Quota · Propriétés GSC
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Plan actuel */}
        <div className="panel p-6 space-y-4">
          <div className="section-title" style={{ fontSize: "10px" }}>PLAN ACTUEL</div>

          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-lg font-bold tracking-widest"
                style={{ fontFamily: "'Oxanium', sans-serif", color: plan?.plan === "pro" ? "#64dcff" : "var(--accent-green)" }}
              >
                {plan?.plan?.toUpperCase() ?? "FREE"}
              </div>
              <div className="label-tag mt-1" style={{ fontSize: "8px" }}>
                {plan?.plan === "pro" ? "Accès complet — 2000 inspections/jour" : "1 propriété · 20 inspections/jour · 5 soumissions/jour"}
              </div>
            </div>
            {plan?.plan !== "pro" && (
              <button
                className="px-4 py-2 rounded text-xs transition-all"
                style={{
                  fontFamily: "'Oxanium', sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  background: "rgba(100, 220, 255, 0.08)",
                  color: "#64dcff",
                  border: "1px solid rgba(100, 220, 255, 0.25)",
                }}
              >
                PASSER PRO — 19€/mois
              </button>
            )}
          </div>
        </div>

        {/* Quota du jour */}
        <div className="panel p-6 space-y-4">
          <div className="section-title" style={{ fontSize: "10px" }}>QUOTA AUJOURD'HUI</div>

          {loadingUsage ? (
            <div className="label-tag" style={{ fontSize: "9px" }}>Chargement…</div>
          ) : (
            <div className="space-y-6">
              <UsageBar
                used={usage?.inspections ?? 0}
                appLimit={limits.inspections}
                googleLimit={GOOGLE_LIMITS.inspections}
                label="INSPECTIONS URL"
                color="var(--accent-green)"
                note="par projet Google Cloud — partagé"
              />
              <div style={{ borderTop: "1px solid var(--border-dim)" }} />
              <UsageBar
                used={usage?.indexations ?? 0}
                appLimit={limits.indexations}
                googleLimit={GOOGLE_LIMITS.indexations}
                label="SOUMISSIONS INDEXING"
                color="var(--accent-amber)"
                note="par compte Google — individuel"
              />
            </div>
          )}
        </div>

        {/* Propriétés GSC */}
        <div className="panel p-6 space-y-4">
          <div className="section-title" style={{ fontSize: "10px" }}>PROPRIÉTÉS GSC</div>

          {sitesLoading ? (
            <div className="label-tag" style={{ fontSize: "9px" }}>Chargement…</div>
          ) : sites.length === 0 ? (
            <div className="label-tag" style={{ fontSize: "9px" }}>Aucune propriété trouvée.</div>
          ) : (
            <div className="space-y-1">
              {sites.map((site) => {
                const isActive = site.siteUrl === siteUrl;
                return (
                  <div
                    key={site.siteUrl}
                    className="flex items-center gap-3 px-3 py-2.5 rounded"
                    style={{
                      background: isActive ? "rgba(0, 230, 118, 0.06)" : "var(--surface-2)",
                      border: `1px solid ${isActive ? "rgba(0, 230, 118, 0.2)" : "var(--border-dim)"}`,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: isActive ? "var(--accent-green)" : "var(--text-dim)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs truncate"
                        style={{ color: isActive ? "var(--foreground)" : "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {site.siteUrl}
                      </div>
                      <div className="label-tag mt-0.5" style={{ fontSize: "8px" }}>
                        {site.permissionLevel}
                      </div>
                    </div>
                    {isActive && (
                      <span className="label-tag" style={{ fontSize: "8px", color: "var(--accent-green)" }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
