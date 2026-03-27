"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Search, TrendingUp, Zap, ClipboardCheck, Settings, LogOut } from "lucide-react";
import { SiteSelector } from "./SiteSelector";
import { useSite } from "./SiteContext";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { href: "/",             icon: LayoutDashboard, label: "Overview",    code: "01" },
  { href: "/keywords",     icon: Search,          label: "Mots-clés",   code: "02" },
  { href: "/pages",        icon: TrendingUp,      label: "Pages",       code: "03" },
  { href: "/opportunities",icon: Zap,             label: "Opportunités",code: "04" },
  { href: "/audit",        icon: ClipboardCheck,  label: "Audit",       code: "05" },
  { href: "/settings",     icon: Settings,        label: "Réglages",    code: "06" },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const { siteUrl, setSiteUrl } = useSite();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = user.user_metadata?.full_name ?? user.email ?? "Utilisateur";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

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
          <span className="label-tag" style={{ color: "var(--accent-green)", fontSize: "10px" }}>
            SYSTÈME ACTIF
          </span>
        </div>
        <p
          className="text-sm font-bold mb-0.5 tracking-wide"
          style={{ fontFamily: "'Oxanium', sans-serif", color: "var(--foreground)" }}
        >
          RANKLIT
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
              <span
                className="label-tag flex-shrink-0 w-5"
                style={{
                  color: isActive ? "var(--accent-green)" : "var(--text-dim)",
                  fontSize: "10px",
                }}
              >
                {item.code}
              </span>

              <Icon
                className="h-3.5 w-3.5 flex-shrink-0 transition-colors"
                style={{ color: isActive ? "var(--accent-green)" : "var(--text-muted)" }}
              />

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

      {/* User + déconnexion */}
      <div
        className="px-4 py-4 space-y-3"
        style={{ borderTop: "1px solid var(--border-dim)" }}
      >
        {/* Avatar + nom */}
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-7 h-7 rounded-full flex-shrink-0"
              style={{ border: "1px solid var(--border-subtle)" }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{
                background: "rgba(0, 230, 118, 0.12)",
                color: "var(--accent-green)",
                fontFamily: "'Oxanium', sans-serif",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div
              className="text-xs font-medium truncate"
              style={{ color: "var(--foreground)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {displayName}
            </div>
            <div className="label-tag" style={{ fontSize: "10px" }}>PLAN FREE</div>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all"
          style={{
            color: "var(--text-dim)",
            fontFamily: "'Oxanium', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.07em",
          }}
        >
          <LogOut className="h-3 w-3" />
          DÉCONNEXION
        </button>
      </div>
    </aside>
  );
}
