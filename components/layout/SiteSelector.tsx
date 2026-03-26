"use client";

import { useState, useRef, useEffect } from "react";
import { SITES, getSiteConfig, type SiteConfig } from "@/lib/sites";
import { ChevronDown } from "lucide-react";

interface SiteSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Grouper les sites
const GROUPS = Array.from(new Set(SITES.map((s) => s.group)));

export function SiteSelector({ value, onChange }: SiteSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getSiteConfig(value) ?? SITES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-subtle)",
          color: "var(--foreground)",
          fontFamily: "'JetBrains Mono', monospace",
          minWidth: 200,
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: current.color }}
        />
        <span className="flex-1 text-left truncate">{current.shortLabel}</span>
        <ChevronDown
          className="h-3 w-3 flex-shrink-0 transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded z-50 py-1 min-w-[280px]"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {GROUPS.map((group) => {
            const groupSites = SITES.filter((s) => s.group === group);
            return (
              <div key={group}>
                <div
                  className="px-3 py-2 label-tag"
                  style={{ fontSize: "9px", color: "var(--text-dim)", borderTop: "1px solid var(--border-dim)" }}
                >
                  {group}
                </div>
                {groupSites.map((site) => {
                  const isActive = site.value === value;
                  return (
                    <button
                      key={site.value}
                      onClick={() => { onChange(site.value); setOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                      style={{
                        background: isActive ? `color-mix(in srgb, ${site.color} 8%, transparent)` : "transparent",
                        borderLeft: isActive ? `2px solid ${site.color}` : "2px solid transparent",
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: site.color, opacity: isActive ? 1 : 0.4 }}
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
                          {site.label}
                        </div>
                        <div
                          className="label-tag truncate mt-0.5"
                          style={{ fontSize: "9px", color: isActive ? site.color : "var(--text-dim)" }}
                        >
                          {site.value}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
