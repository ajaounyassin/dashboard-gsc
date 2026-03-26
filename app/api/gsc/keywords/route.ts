import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";
import { getKeywordData } from "@/lib/gsc/queries";
import { computeLowHangingFruits, computeCTROpportunities } from "@/lib/data/processor";
import { ALLOWED_SITE_URLS, DEFAULT_SITE, getBrandRegex } from "@/lib/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const today = new Date();
    const defaultEnd   = format(subDays(today, 3),  "yyyy-MM-dd");
    const defaultStart = format(subDays(today, 32), "yyyy-MM-dd");

    const startDate = searchParams.get("startDate") ?? defaultStart;
    const endDate   = searchParams.get("endDate")   ?? defaultEnd;
    const rawSite   = searchParams.get("siteUrl")   ?? DEFAULT_SITE.value;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
      return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });

    if (!ALLOWED_SITE_URLS.has(rawSite))
      return NextResponse.json({ error: "Propriété GSC non autorisée." }, { status: 403 });

    const rows = await getKeywordData(startDate, endDate, rawSite);
    const brandRegex = getBrandRegex(rawSite);

    return NextResponse.json({
      lowHangingFruits: computeLowHangingFruits(rows, brandRegex),
      ctrOpportunities: computeCTROpportunities(rows, brandRegex),
    }, { status: 200 });
  } catch (error) {
    console.error("[/api/gsc/keywords]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur inconnue" }, { status: 500 });
  }
}
