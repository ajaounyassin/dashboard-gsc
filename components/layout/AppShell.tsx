"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import type { User } from "@supabase/supabase-js";

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Fermer sidebar au changement de route
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — toujours visible md+, drawer sur mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar user={user} />
      </div>

      {/* Bouton hamburger — visible uniquement mobile */}
      <button
        className="fixed top-3.5 left-3.5 z-50 flex items-center justify-center w-8 h-8 rounded md:hidden"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
        }}
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Menu"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          {sidebarOpen ? (
            <>
              <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          ) : (
            <>
              <line x1="2" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </button>

      {/* Main content */}
      <main className="md:ml-56 min-h-screen overflow-auto">
        {children}
      </main>
    </>
  );
}
