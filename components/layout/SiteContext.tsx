"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

interface SiteContextType {
  sites: GscSite[];
  siteUrl: string;
  setSiteUrl: (url: string) => void;
  isLoading: boolean;
}

const SiteContext = createContext<SiteContextType>({
  sites: [],
  siteUrl: "",
  setSiteUrl: () => {},
  isLoading: true,
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<GscSite[]>([]);
  const [siteUrl, setSiteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gsc/sites")
      .then((r) => r.json())
      .then((data) => {
        const fetched: GscSite[] = data.sites ?? [];
        setSites(fetched);
        if (fetched.length > 0) setSiteUrl(fetched[0].siteUrl ?? "");
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SiteContext.Provider value={{ sites, siteUrl, setSiteUrl, isLoading }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
