/**
 * Script d'autorisation OAuth2 — À exécuter UNE SEULE FOIS
 *
 * Usage :
 *   node scripts/authorize.mjs
 *
 * Prérequis : avoir un fichier client_secret_*.json téléchargé depuis
 * Google Cloud Console et passé en argument (ou via les variables d'env).
 *
 * Exemples :
 *   node scripts/authorize.mjs path/to/client_secret_*.json
 *   GSC_CLIENT_ID=xxx GSC_CLIENT_SECRET=yyy node scripts/authorize.mjs
 */

import { createServer } from "http";
import { OAuth2Client } from "google-auth-library";
import { exec } from "child_process";
import { readFileSync } from "fs";

// ── Lecture des credentials ───────────────────────────────────
let CLIENT_ID = process.env.GSC_CLIENT_ID;
let CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;

// Accepte un fichier client_secret_*.json en argument
const jsonArg = process.argv[2];
if (jsonArg && (!CLIENT_ID || !CLIENT_SECRET)) {
  try {
    const raw = JSON.parse(readFileSync(jsonArg, "utf-8"));
    const creds = raw.installed ?? raw.web ?? raw;
    CLIENT_ID = creds.client_id;
    CLIENT_SECRET = creds.client_secret;
  } catch (e) {
    console.error(`Impossible de lire le fichier : ${jsonArg}`);
    process.exit(1);
  }
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "❌ Credentials manquants.\n" +
    "   Option 1 : node scripts/authorize.mjs chemin/vers/client_secret_*.json\n" +
    "   Option 2 : définir GSC_CLIENT_ID et GSC_CLIENT_SECRET dans .env.local"
  );
  process.exit(1);
}
// ─────────────────────────────────────────────────────────────

const REDIRECT_URI = "http://localhost:4242/callback";
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent",
});

console.log("\n📋 Ouverture du navigateur pour l'autorisation Google...\n");
console.log("   Si le navigateur ne s'ouvre pas, copiez cette URL :");
console.log(`   ${authUrl}\n`);

const opener =
  process.platform === "win32"
    ? `start "" "${authUrl}"`
    : process.platform === "darwin"
    ? `open "${authUrl}"`
    : `xdg-open "${authUrl}"`;

exec(opener);

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) return;

  const url = new URL(req.url, "http://localhost:4242");
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("Erreur : code OAuth2 manquant.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<html><body style="font-family:sans-serif;padding:2rem">
      <h2>✅ Autorisation réussie !</h2>
      <p>Fermez cet onglet et revenez dans le terminal.</p>
    </body></html>`);

    console.log("\n✅ Tokens obtenus !\n");
    console.log("═".repeat(60));
    console.log("Ajoutez ces lignes dans votre fichier .env.local :\n");
    console.log(`GSC_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GSC_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GSC_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("═".repeat(60));

    if (!tokens.refresh_token) {
      console.log("\n⚠️  Aucun refresh_token. Révoquez l'accès sur https://myaccount.google.com/permissions puis relancez.");
    }

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("Erreur :", err);
    res.writeHead(500);
    res.end("Erreur serveur.");
    server.close();
    process.exit(1);
  }
});

server.listen(4242, () => {
  console.log("⏳ En attente du callback sur http://localhost:4242...\n");
});
