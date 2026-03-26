// ============================================================
// Client Google Search Console — Auth OAuth2 (refresh token)
// ============================================================

import { google, Auth } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

/**
 * Retourne un client OAuth2 configuré avec le refresh token.
 * Utilise un singleton pour éviter de recréer le client à chaque requête.
 *
 * Variables d'env requises dans .env.local :
 *   GSC_CLIENT_ID       — depuis le fichier client_secret_*.json
 *   GSC_CLIENT_SECRET   — depuis le fichier client_secret_*.json
 *   GSC_REFRESH_TOKEN   — obtenu via `node scripts/authorize.mjs`
 */
let authClientCache: Auth.OAuth2Client | null = null;

export function getGSCAuthClient(): Auth.OAuth2Client {
  if (authClientCache) return authClientCache;

  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Variables d'environnement manquantes.\n" +
        "Assurez-vous que GSC_CLIENT_ID, GSC_CLIENT_SECRET et GSC_REFRESH_TOKEN " +
        "sont définis dans .env.local.\n" +
        "Lancez `node scripts/authorize.mjs` pour obtenir votre refresh token."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  authClientCache = oauth2Client;
  return oauth2Client;
}

/**
 * Retourne une instance de l'API Search Console.
 */
export function getSearchConsoleClient() {
  const auth = getGSCAuthClient();
  return google.searchconsole({ version: "v1", auth });
}

/**
 * URL de la propriété GSC — fallback sur la variable d'env si non fournie.
 */
export function getSiteUrl(siteUrl?: string): string {
  const url = siteUrl ?? process.env.GSC_SITE_URL;
  if (!url) {
    throw new Error("GSC_SITE_URL n'est pas défini.");
  }
  return url;
}
