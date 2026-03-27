"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: [
          "https://www.googleapis.com/auth/webmasters.readonly",
          "https://www.googleapis.com/auth/indexing",
          "openid",
          "email",
          "profile",
        ].join(" "),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--surface-0)" }}
    >
      {/* Logo / titre */}
      <div className="mb-12 text-center">
        <div
          className="text-4xl font-bold tracking-widest mb-2"
          style={{
            fontFamily: "'Oxanium', sans-serif",
            color: "var(--foreground)",
            letterSpacing: "0.15em",
          }}
        >
          RANKLIT
        </div>
        <div className="label-tag" style={{ fontSize: "10px" }}>
          Google Search Console · Inspection · Indexation
        </div>
      </div>

      {/* Card login */}
      <div
        className="panel w-full max-w-sm p-8 flex flex-col gap-6"
      >
        <div>
          <div
            className="section-title mb-1"
            style={{ fontSize: "11px" }}
          >
            CONNEXION
          </div>
          <p className="text-xs" style={{ color: "var(--text-dim)", lineHeight: 1.6 }}>
            Connecte ton compte Google pour accéder à tes données Search Console.
          </p>
        </div>

        {error && (
          <div
            className="text-xs px-3 py-2 rounded"
            style={{
              background: "rgba(255,82,82,0.08)",
              border: "1px solid rgba(255,82,82,0.2)",
              color: "var(--accent-red)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ✕ {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded transition-all disabled:opacity-50"
          style={{
            fontFamily: "'Oxanium', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.1em",
            background: "rgba(0, 230, 118, 0.08)",
            color: "var(--accent-green)",
            border: "1px solid rgba(0, 230, 118, 0.25)",
          }}
        >
          {isLoading ? (
            "CONNEXION EN COURS…"
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              SE CONNECTER AVEC GOOGLE
            </>
          )}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-dim)", lineHeight: 1.6 }}>
          Ranklit accède en lecture seule à tes données GSC.<br />
          Le scope Indexing API est requis pour la soumission d'URLs.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 label-tag" style={{ fontSize: "10px" }}>
        RANKLIT · DASHBOARD GOOGLE SEARCH CONSOLE
      </div>
    </div>
  );
}
