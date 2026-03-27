import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, error } = await getAuthenticatedUser();
  if (error) return error;

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_usage")
    .select("inspections, indexations")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  return NextResponse.json({
    usage: { inspections: data?.inspections ?? 0, indexations: data?.indexations ?? 0 },
  });
}
