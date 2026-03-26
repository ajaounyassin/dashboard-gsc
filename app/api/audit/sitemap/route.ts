import { NextRequest, NextResponse } from "next/server";
import { fetchSitemap } from "@/lib/gsc/audit";
import { ALLOWED_SITE_URLS, DEFAULT_SITE } from "@/lib/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSite = searchParams.get("siteUrl") ?? DEFAULT_SITE.value;

    if (!ALLOWED_SITE_URLS.has(rawSite))
      return NextResponse.json({ error: "Propriété GSC non autorisée." }, { status: 403 });

    const { entries, truncated, totalCount } = await fetchSitemap(rawSite);

    return NextResponse.json(
      { urls: entries, truncated, totalCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("[/api/audit/sitemap]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
