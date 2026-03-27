"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useSite } from "./SiteContext";

function formatSiteLabel(siteUrl: string): string {
  if (siteUrl.startsWith("sc-domain:")) {
    return siteUrl.slice("sc-domain:".length);
  }
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return siteUrl;
  }
}

interface SiteSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SiteSelector({ value, onChange }: SiteSelectorProps) {
  const { sites, isLoading } = useSite();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLabel = value ? formatSiteLabel(value) : "—";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !isLoading && setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all disabled:opacity-50"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-subtle)",
          color: "var(--foreground)",
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: 160,
        }}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-green-400" style={{ background: "var(--accent-green)" }} />
        )}
        <span className="flex-1 text-left truncate text-xs">{currentLabel}</span>
        <ChevronDown
          className="h-3 w-3 flex-shrink-0 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && sites.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 rounded z-50 py-1 min-w-[280px] max-h-64 overflow-y-auto"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {sites.map((site) => {
            const isActive = site.siteUrl === value;
            const label = formatSiteLabel(site.siteUrl ?? "");
            return (
              <button
                key={site.siteUrl}
                onClick={() => { onChange(site.siteUrl ?? ""); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                style={{
                  background: isActive ? "rgba(0, 230, 118, 0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--accent-green)" : "2px solid transparent",
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "var(--accent-green)", opacity: isActive ? 1 : 0.3 }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs truncate"
                    style={{
                      color: isActive ? "var(--foreground)" : "var(--text-muted)",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    className="label-tag truncate mt-0.5"
                    style={{ fontSize: "9px", color: isActive ? "var(--accent-green)" : "var(--text-dim)" }}
                  >
                    {site.siteUrl}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
