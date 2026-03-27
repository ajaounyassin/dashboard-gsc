import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { SiteProvider } from "@/components/layout/SiteContext";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ranklit — GSC Dashboard",
  description: "Dashboard Google Search Console — Inspection & Indexation",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {user ? (
          <SiteProvider>
            <Sidebar user={user} />
            <main className="ml-56 min-h-screen overflow-auto">
              {children}
            </main>
          </SiteProvider>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
