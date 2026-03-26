// ============================================================
// Configuration des propriétés GSC — une config Brand par site
// ============================================================

export interface SiteConfig {
  label: string;
  shortLabel: string;
  value: string;
  group: string;
  color: string;
  /** Regex brand spécifique à ce site (appliquée sur les mots-clés) */
  brandRegex: RegExp;
  /** Nom affiché pour la marque dans les graphiques */
  brandName: string;
}

export const SITES: SiteConfig[] = [
  {
    label: "Clean Pro — Domaine complet",
    shortLabel: "cleanpro · domaine",
    value: "sc-domain:cleanpro-nettoyage-strasbourg.fr",
    group: "CLEANPRO-NETTOYAGE-STRASBOURG.FR",
    color: "#00e676",
    brandName: "Clean Pro",
    brandRegex: /\bclean[\s-]?pro(?:\s+(?:nettoyage|strasbourg))?\b/i,
  },
  {
    label: "Clean Pro — https://",
    shortLabel: "cleanpro · https",
    value: "https://cleanpro-nettoyage-strasbourg.fr/",
    group: "CLEANPRO-NETTOYAGE-STRASBOURG.FR",
    color: "#40c4ff",
    brandName: "Clean Pro",
    brandRegex: /\bclean[\s-]?pro(?:\s+(?:nettoyage|strasbourg))?\b/i,
  },
  {
    label: "Clean Pro — www",
    shortLabel: "cleanpro · www",
    value: "https://www.cleanpro-nettoyage-strasbourg.fr/",
    group: "CLEANPRO-NETTOYAGE-STRASBOURG.FR",
    color: "#40c4ff",
    brandName: "Clean Pro",
    brandRegex: /\bclean[\s-]?pro(?:\s+(?:nettoyage|strasbourg))?\b/i,
  },
  {
    label: "FTN Solutions — Domaine complet",
    shortLabel: "ftnsolutions · domaine",
    value: "sc-domain:ftnsolutions.fr",
    group: "FTNSOLUTIONS.FR",
    color: "#ffab00",
    brandName: "FTN Solutions",
    brandRegex: /\bftn[\s-]?solutions?\b/i,
  },
];

export const DEFAULT_SITE = SITES[0];

export const ALLOWED_SITE_URLS = new Set(SITES.map((s) => s.value));

export function getSiteConfig(value: string): SiteConfig | undefined {
  return SITES.find((s) => s.value === value);
}

/** Retourne la regex brand du site, ou celle de Clean Pro par défaut. */
export function getBrandRegex(siteUrl: string): RegExp {
  return getSiteConfig(siteUrl)?.brandRegex ?? SITES[0].brandRegex;
}
