import { NextResponse } from "next/server";

import { getAuthenticatedProfile } from "@/lib/auth";
import { HOMEOWNER_ID_BUCKET } from "@/lib/homeowner-identification";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile().catch(() => null);
  if (!profile || profile.role !== "community_manager" || profile.access_status !== "active") {
    return new Response("Forbidden", { status: 403 });
  }
  const { id } = await context.params;
  const admin = createAdminClient();
  const { data: application } = await admin.from("homeowner_applications")
    .select("id,id_image_path,id_deleted_at").eq("id", id).maybeSingle();
  if (!application?.id_image_path || application.id_deleted_at) return new Response("Not found", { status: 404 });
  const { data, error } = await admin.storage.from(HOMEOWNER_ID_BUCKET).createSignedUrl(application.id_image_path, 300);
  if (error || !data) return new Response("Not found", { status: 404 });
  const { error: auditError } = await admin.from("homeowner_id_access_log").insert({ application_id: application.id, manager_id: profile.id });
  if (auditError) return new Response("Could not record access", { status: 503 });
  return NextResponse.redirect(data.signedUrl, { headers: { "cache-control": "private, no-store" } });
}
