// ============================================================
// Helpers d'auth pour les routes API
// ============================================================

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AuthResult =
  | { userId: string; error: null }
  | { userId: null; error: NextResponse };

/**
 * Extrait l'utilisateur authentifié depuis la session Supabase.
 * Retourne un 401 si non authentifié.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }

  return { userId: user.id, error: null };
}

const FREE_LIMITS = { inspections: 20, indexations: 5 };
const PRO_LIMITS = { inspections: 2000, indexations: 200 };

/**
 * Vérifie le quota quotidien de l'utilisateur.
 */
export async function checkQuota(
  userId: string,
  action: "inspections" | "indexations",
  count: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .single();

  const plan = (sub as { plan: string } | null)?.plan ?? "free";
  const limit = plan === "pro" ? PRO_LIMITS[action] : FREE_LIMITS[action];

  const { data: usage } = await supabase
    .from("daily_usage")
    .select(action)
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const used = (usage as Record<string, number> | null)?.[action] ?? 0;
  const remaining = Math.max(0, limit - used);

  return { allowed: used + count <= limit, remaining };
}

/**
 * Incrémente le compteur d'usage quotidien.
 */
export async function incrementUsage(
  userId: string,
  action: "inspections" | "indexations",
  count: number
): Promise<void> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_usage")
    .select(action)
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const current = (data as Record<string, number> | null)?.[action] ?? 0;

  await supabase.from("daily_usage").upsert(
    { user_id: userId, date: today, [action]: current + count },
    { onConflict: "user_id,date" }
  );
}
