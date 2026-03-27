import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId, error } = await getAuthenticatedUser();
  if (error) return error;

  const siteUrl = new URL(request.url).searchParams.get("siteUrl");
  if (!siteUrl)
    return NextResponse.json({ error: "siteUrl manquant." }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error: dbError } = await supabase
    .from("audit_results")
    .select("*")
    .eq("user_id", userId)
    .eq("site_url", siteUrl);

  if (dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ results: data ?? [] }, { status: 200 });
}
