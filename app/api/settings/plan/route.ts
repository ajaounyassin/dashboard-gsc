import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, error } = await getAuthenticatedUser();
  if (error) return error;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .single();

  return NextResponse.json({ plan: data?.plan ?? "free" });
}
