import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";
import { getPageData } from "@/lib/gsc/queries";
import { computeWinnersLosers } from "@/lib/data/processor";
import { ALLOWED_SITE_URLS, DEFAULT_SITE } from "@/lib/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const today = new Date();
    const currentEnd   = format(subDays(today, 3),  "yyyy-MM-dd");
    const currentStart = format(subDays(today, 32), "yyyy-MM-dd");
    const previousEnd  = format(subDays(today, 33), "yyyy-MM-dd");
    const previousStart= format(subDays(today, 62), "yyyy-MM-dd");

    const cStart  = searchParams.get("currentStart")  ?? currentStart;
    const cEnd    = searchParams.get("currentEnd")    ?? currentEnd;
    const pStart  = searchParams.get("previousStart") ?? previousStart;
    const pEnd    = searchParams.get("previousEnd")   ?? previousEnd;
    const rawSite = searchParams.get("siteUrl")       ?? DEFAULT_SITE.value;
    const limit   = parseInt(searchParams.get("limit") ?? "10", 10);

    if (!ALLOWED_SITE_URLS.has(rawSite)) {
      return NextResponse.json({ error: "Propriété GSC non autorisée." }, { status: 403 });
    }

    const [currentRows, previousRows] = await Promise.all([
      getPageData(cStart, cEnd, rawSite),
      getPageData(pStart, pEnd, rawSite),
    ]);

    const winnersLosers = computeWinnersLosers(
      currentRows, previousRows,
      { current: { start: cStart, end: cEnd }, previous: { start: pStart, end: pEnd } },
      limit
    );

    return NextResponse.json({ winnersLosers }, { status: 200 });
  } catch (error) {
    console.error("[/api/gsc/pages]", error);
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
