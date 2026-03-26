"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { DEFAULT_SITE } from "@/lib/sites";

interface SiteContextType {
  siteUrl: string;
  setSiteUrl: (url: string) => void;
}

const SiteContext = createContext<SiteContextType>({
  siteUrl: DEFAULT_SITE.value,
  setSiteUrl: () => {},
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [siteUrl, setSiteUrl] = useState(DEFAULT_SITE.value);
  return (
    <SiteContext.Provider value={{ siteUrl, setSiteUrl }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
