import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { SiteProvider } from "@/components/layout/SiteContext";

export const metadata: Metadata = {
  title: "GSC Dashboard",
  description: "Tableau de bord Google Search Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <SiteProvider>
          <Sidebar />
          <main className="ml-56 min-h-screen overflow-auto">
            {children}
          </main>
        </SiteProvider>
      </body>
    </html>
  );
}
