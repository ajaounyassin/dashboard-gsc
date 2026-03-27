import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";
import { getPageData } from "@/lib/gsc/queries";
import { computeWinnersLosers } from "@/lib/data/processor";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getGSCAuthClientForUser } from "@/lib/gsc/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);

    const today = new Date();
    const currentEnd    = format(subDays(today, 3),  "yyyy-MM-dd");
    const currentStart  = format(subDays(today, 32), "yyyy-MM-dd");
    const previousEnd   = format(subDays(today, 33), "yyyy-MM-dd");
    const previousStart = format(subDays(today, 62), "yyyy-MM-dd");

    const cStart  = searchParams.get("currentStart")  ?? currentStart;
    const cEnd    = searchParams.get("currentEnd")    ?? currentEnd;
    const pStart  = searchParams.get("previousStart") ?? previousStart;
    const pEnd    = searchParams.get("previousEnd")   ?? previousEnd;
    const siteUrl = searchParams.get("siteUrl");
    const limit   = parseInt(searchParams.get("limit") ?? "10", 10);

    if (!siteUrl)
      return NextResponse.json({ error: "siteUrl manquant." }, { status: 400 });

    const auth = await getGSCAuthClientForUser(userId);
    const [currentRows, previousRows] = await Promise.all([
      getPageData(auth, cStart, cEnd, siteUrl),
      getPageData(auth, pStart, pEnd, siteUrl),
    ]);

    const winnersLosers = computeWinnersLosers(
      currentRows, previousRows,
      { current: { start: cStart, end: cEnd }, previous: { start: pStart, end: pEnd } },
      limit
    );

    return NextResponse.json({ winnersLosers }, { status: 200 });
  } catch (err) {
    console.error("[/api/gsc/pages]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
