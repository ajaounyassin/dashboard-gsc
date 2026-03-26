import { NextRequest, NextResponse } from "next/server";
import { inspectUrls } from "@/lib/gsc/audit";
import { ALLOWED_SITE_URLS } from "@/lib/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSPECT_CAP = 50; // Vercel Hobby : timeout 60s

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

    const capped = (urls as string[]).slice(0, INSPECT_CAP);
    const results = await inspectUrls(capped, siteUrl);

    return NextResponse.json(
      { results, processed: results.length, total: urls.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/audit/inspect]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
