import { NextRequest, NextResponse } from "next/server";
import { fetchSitemap } from "@/lib/gsc/audit";
import { getAuthenticatedUser } from "@/lib/api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId: _userId, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get("siteUrl");

    if (!siteUrl)
      return NextResponse.json({ error: "siteUrl manquant." }, { status: 400 });

    const { entries, truncated, totalCount } = await fetchSitemap(siteUrl);

    return NextResponse.json(
      { urls: entries, truncated, totalCount },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/audit/sitemap]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
