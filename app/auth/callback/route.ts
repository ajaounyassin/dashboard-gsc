import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[auth/callback]", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Stocker le refresh_token Google dans user_tokens
  const providerToken = data.session.provider_token;
  const providerRefreshToken = data.session.provider_refresh_token;
  const userId = data.session.user.id;

  if (providerRefreshToken) {
    const serviceClient = createServiceClient();
    await serviceClient.from("user_tokens").upsert(
      {
        user_id: userId,
        google_refresh_token: providerRefreshToken,
        google_access_token: providerToken ?? null,
        token_expires_at: providerToken
          ? new Date(Date.now() + 3600 * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  // Créer une entrée subscription free par défaut si elle n'existe pas
  const serviceClient = createServiceClient();
  await serviceClient.from("subscriptions").upsert(
    { user_id: userId, plan: "free" },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  return NextResponse.redirect(`${origin}${next}`);
}
