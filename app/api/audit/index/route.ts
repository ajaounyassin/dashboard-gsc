import { NextRequest, NextResponse } from "next/server";
import { requestIndexingBatch } from "@/lib/gsc/audit";
import { getAuthenticatedUser, checkQuota, incrementUsage } from "@/lib/api/auth";
import { getGSCAuthClientForUser } from "@/lib/gsc/client";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDEXING_CAP = 200;

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

    const capped = (urls as string[]).slice(0, INDEXING_CAP);

    const { allowed, remaining } = await checkQuota(userId, "indexations", capped.length);
    if (!allowed) {
      return NextResponse.json(
        { error: `Quota dépassé. Il vous reste ${remaining} soumission(s) aujourd'hui.` },
        { status: 429 }
      );
    }

    const auth = await getGSCAuthClientForUser(userId);
    const results = await requestIndexingBatch(auth, capped);

    await incrementUsage(userId, "indexations", results.filter((r) => r.success).length);

    // Persister en Supabase
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    await supabase.from("audit_results").upsert(
      results.map((r) => ({
        user_id: userId,
        site_url: siteUrl,
        url: r.url,
        indexing_success: r.success,
        indexing_error: r.error ?? null,
        indexed_at: r.success ? now : null,
      })),
      { onConflict: "user_id,site_url,url", ignoreDuplicates: false }
    );

    const scopeError = results.some((r) => !r.success && r.error?.includes("403"));
    if (scopeError && results.every((r) => !r.success)) {
      return NextResponse.json({ error: "INDEXING_SCOPE_MISSING" }, { status: 403 });
    }

    const firstError = results.find((r) => !r.success)?.error ?? null;

    return NextResponse.json(
      { results, processed: results.length, total: urls.length, firstError },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/audit/index]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
