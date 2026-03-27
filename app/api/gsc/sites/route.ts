import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getSearchConsoleForUser } from "@/lib/gsc/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const sc = await getSearchConsoleForUser(userId);
    const res = await sc.sites.list();
    const sites = (res.data.siteEntry ?? []).map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel,
    }));
    return NextResponse.json({ sites }, { status: 200 });
  } catch (err) {
    console.error("[/api/gsc/sites]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
