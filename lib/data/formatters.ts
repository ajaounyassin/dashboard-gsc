// ============================================================
// Utilitaires de formatage des données pour l'affichage
// ============================================================

/**
 * Formate un nombre en notation compacte : 1500 → "1,5K"
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("fr-FR");
}

/**
 * Formate un CTR en pourcentage : 0.0543 → "5.43%"
 * Accepte aussi une valeur déjà en % (ex: 5.43)
 */
export function formatCtr(value: number): string {
  // Si la valeur est entre 0 et 1, c'est une fraction → convertir
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(2)}%`;
}

/**
 * Formate une position avec 1 décimale.
 */
export function formatPosition(value: number): string {
  return value.toFixed(1);
}

/**
 * Formate un delta de clics avec signe.
 */
export function formatDelta(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR")}`;
}

/**
 * Formate un delta en % avec signe.
 */
export function formatDeltaPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Tronque une URL pour l'affichage dans les tableaux.
 */
export function truncateUrl(url: string, maxLength = 60): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    if (path.length <= maxLength) return path;
    return path.slice(0, maxLength - 3) + "...";
  } catch {
    return url.length <= maxLength ? url : url.slice(0, maxLength - 3) + "...";
  }
}

/**
 * Retourne la couleur Tailwind selon le delta (positif / négatif).
 */
export function deltaColor(value: number): string {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-red-500";
  return "text-gray-400";
}

/**
 * Retourne la couleur selon le type de trafic.
 */
export function trafficTypeColor(type: "brand" | "non-brand"): string {
  return type === "brand" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700";
}
