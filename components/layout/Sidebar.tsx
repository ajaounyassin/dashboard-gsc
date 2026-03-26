"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, TrendingUp, Zap, ClipboardCheck } from "lucide-react";
import { SiteSelector } from "./SiteSelector";
import { useSite } from "./SiteContext";

const NAV_ITEMS = [
  { href: "/",             icon: LayoutDashboard, label: "Overview",    code: "01" },
  { href: "/keywords",     icon: Search,          label: "Mots-clés",   code: "02" },
  { href: "/pages",        icon: TrendingUp,      label: "Pages",       code: "03" },
  { href: "/opportunities",icon: Zap,             label: "Opportunités",code: "04" },
  { href: "/audit",        icon: ClipboardCheck,  label: "Audit",       code: "05" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { siteUrl, setSiteUrl } = useSite();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 w-56 flex flex-col"
      style={{
        background: "var(--surface-1)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="status-dot" />
          <span className="label-tag" style={{ color: "var(--accent-green)", fontSize: "9px" }}>
            SYSTÈME ACTIF
          </span>
        </div>
        <p
          className="text-sm font-bold mb-0.5 tracking-wide"
          style={{ fontFamily: "'Oxanium', sans-serif", color: "var(--foreground)" }}
        >
          GSC DASHBOARD
        </p>
        <div className="mt-3">
          <SiteSelector value={siteUrl} onChange={setSiteUrl} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded transition-all group relative"
              style={{
                background: isActive ? "rgba(0, 230, 118, 0.08)" : "transparent",
                borderLeft: isActive
                  ? "2px solid var(--accent-green)"
                  : "2px solid transparent",
              }}
            >
              {/* Code */}
              <span
                className="label-tag flex-shrink-0 w-5"
                style={{
                  color: isActive ? "var(--accent-green)" : "var(--text-dim)",
                  fontSize: "9px",
                }}
              >
                {item.code}
              </span>

              {/* Icon */}
              <Icon
                className="h-3.5 w-3.5 flex-shrink-0 transition-colors"
                style={{ color: isActive ? "var(--accent-green)" : "var(--text-muted)" }}
              />

              {/* Label */}
              <span
                className="text-sm transition-colors"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: isActive ? "var(--foreground)" : "var(--text-muted)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {item.label}
              </span>

              {/* Active glow */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded pointer-events-none"
                  style={{ boxShadow: "inset 0 0 20px rgba(0, 230, 118, 0.04)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid var(--border-dim)" }}
      >
        <div className="label-tag mb-1" style={{ fontSize: "9px" }}>LATENCE DONNÉES</div>
        <div
          className="metric-number text-xs"
          style={{ color: "var(--accent-amber)" }}
        >
          ~48–72h
        </div>
      </div>
    </aside>
  );
}
