import { NextRequest, NextResponse } from "next/server";
import { requestIndexingBatch } from "@/lib/gsc/audit";
import { ALLOWED_SITE_URLS } from "@/lib/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDEXING_CAP = 200; // quota journalier Google Indexing API

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, siteUrl } = body as { urls: unknown; siteUrl: unknown };

    if (!siteUrl || typeof siteUrl !== "string")
      return NextResponse.json({ error: "siteUrl manquant." }, { status: 400 });

    if (!ALLOWED_SITE_URLS.has(siteUrl))
      return NextResponse.json({ error: "Propriété GSC non autorisée." }, { status: 403 });

    if (!Array.isArray(urls) || urls.length === 0)
      return NextResponse.json({ error: "urls doit être un tableau non vide." }, { status: 400 });

    const capped = (urls as string[]).slice(0, INDEXING_CAP);
    const results = await requestIndexingBatch(capped);

    // Détecter si le scope indexing est manquant (403 de l'API Google)
    const scopeError = results.some(
      (r) => !r.success && r.error?.includes("403")
    );
    if (scopeError && results.every((r) => !r.success)) {
      return NextResponse.json(
        { error: "INDEXING_SCOPE_MISSING" },
        { status: 403 }
      );
    }

    // Inclure le premier message d'erreur pour diagnostic côté client
    const firstError = results.find((r) => !r.success)?.error ?? null;

    return NextResponse.json(
      { results, processed: results.length, total: urls.length, firstError },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/audit/index]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
