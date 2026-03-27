// ============================================================
// Client Google — OAuth2 par utilisateur (tokens en Supabase)
// ============================================================

import { google, Auth } from "googleapis";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Crée un OAuth2Client configuré avec le refresh token de l'utilisateur
 * stocké dans la table user_tokens.
 */
export async function getGSCAuthClientForUser(userId: string): Promise<Auth.OAuth2Client> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_tokens")
    .select("google_refresh_token, google_access_token, token_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !data?.google_refresh_token) {
    throw new Error("Token Google introuvable. Reconnectez-vous.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GSC_CLIENT_ID!,
    process.env.GSC_CLIENT_SECRET!
  );

  oauth2Client.setCredentials({
    refresh_token: data.google_refresh_token,
    access_token: data.google_access_token ?? undefined,
    expiry_date: data.token_expires_at
      ? new Date(data.token_expires_at).getTime()
      : undefined,
  });

  return oauth2Client;
}

export async function getSearchConsoleForUser(userId: string) {
  const auth = await getGSCAuthClientForUser(userId);
  return google.searchconsole({ version: "v1", auth });
}

export async function getIndexingForUser(userId: string) {
  const auth = await getGSCAuthClientForUser(userId);
  return google.indexing({ version: "v3", auth });
}
