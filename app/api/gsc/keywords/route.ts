import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";
import { getKeywordData } from "@/lib/gsc/queries";
import { computeLowHangingFruits, computeCTROpportunities } from "@/lib/data/processor";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getGSCAuthClientForUser } from "@/lib/gsc/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_BRAND_REGEX = /$^/;

export async function GET(request: NextRequest) {
  const { userId, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const today = new Date();
    const defaultEnd   = format(subDays(today, 3),  "yyyy-MM-dd");
    const defaultStart = format(subDays(today, 32), "yyyy-MM-dd");

    const startDate = searchParams.get("startDate") ?? defaultStart;
    const endDate   = searchParams.get("endDate")   ?? defaultEnd;
    const siteUrl   = searchParams.get("siteUrl");

    if (!siteUrl)
      return NextResponse.json({ error: "siteUrl manquant." }, { status: 400 });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate))
      return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });

    const auth = await getGSCAuthClientForUser(userId);
    const rows = await getKeywordData(auth, startDate, endDate, siteUrl);

    return NextResponse.json({
      lowHangingFruits: computeLowHangingFruits(rows, NO_BRAND_REGEX),
      ctrOpportunities: computeCTROpportunities(rows, NO_BRAND_REGEX),
    }, { status: 200 });
  } catch (err) {
    console.error("[/api/gsc/keywords]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
