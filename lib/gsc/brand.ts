// ============================================================
// Logique Brand vs Non-Brand — regex par site
// ============================================================

/**
 * Détermine si un mot-clé est de la marque selon la regex du site.
 */
export function isBrandKeyword(keyword: string, brandRegex: RegExp): boolean {
  return brandRegex.test(keyword);
}
