import { NextRequest, NextResponse } from "next/server";
import { inspectUrls } from "@/lib/gsc/audit";
import { getAuthenticatedUser, checkQuota, incrementUsage } from "@/lib/api/auth";
import { getGSCAuthClientForUser } from "@/lib/gsc/client";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSPECT_CAP = 10; // Vercel Hobby : timeout 60s — 10 × ~3s = ~30s

export async function POST(request: NextRequest) {
  const { userId, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const body = await request.json();
    const { urls, siteUrl } = body as { urls: unknown; siteUrl: unknown };

    if (!siteUrl || typeof siteUrl !== "string")
      return NextResponse.json({ error: "siteUrl manquant." }, { status: 400 });

    if (!Array.isArray(urls) || urls.length === 0)
      return NextResponse.json({ error: "urls doit être un tableau non vide." }, { status: 400 });

    const capped = (urls as string[]).slice(0, INSPECT_CAP);

    const { allowed, remaining } = await checkQuota(userId, "inspections", capped.length);
    if (!allowed) {
      return NextResponse.json(
        { error: `Quota dépassé. Il vous reste ${remaining} inspection(s) aujourd'hui.` },
        { status: 429 }
      );
    }

    const auth = await getGSCAuthClientForUser(userId);
    const results = await inspectUrls(auth, capped, siteUrl);

    await incrementUsage(userId, "inspections", results.length);

    // Persister en Supabase
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    await supabase.from("audit_results").upsert(
      results.map((r) => ({
        user_id: userId,
        site_url: siteUrl,
        url: r.url,
        coverage_state: r.coverageState,
        indexing_state: r.indexingState,
        robots_txt_state: r.robotsTxtState,
        last_crawl_time: r.lastCrawlTime ?? null,
        inspected_at: now,
      })),
      { onConflict: "user_id,site_url,url" }
    );

    return NextResponse.json(
      { results, processed: results.length, total: urls.length },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/audit/inspect]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
