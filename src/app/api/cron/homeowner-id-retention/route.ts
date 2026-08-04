import { HOMEOWNER_ID_BUCKET } from "@/lib/homeowner-identification";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

async function removeObject(path: string) {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(HOMEOWNER_ID_BUCKET).remove([path]);
  return !error;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const draftCutoff = nowIso;
  const pendingCutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1_000).toISOString();
  const counts = { decidedDeleted: 0, pendingExpired: 0, draftsDeleted: 0, failures: 0 };

  const { data: decided = [] } = await admin.from("homeowner_applications")
    .select("id,id_image_path").in("status", ["approved", "rejected"])
    .lte("id_delete_after", nowIso).is("id_deleted_at", null).not("id_image_path", "is", null).limit(100);
  for (const application of decided ?? []) {
    if (!application.id_image_path || !(await removeObject(application.id_image_path))) { counts.failures += 1; continue; }
    const { error } = await admin.from("homeowner_applications").update({ id_image_path: null, id_deleted_at: nowIso }).eq("id", application.id).is("id_deleted_at", null);
    if (error) counts.failures += 1; else counts.decidedDeleted += 1;
  }

  const { data: pending = [] } = await admin.from("homeowner_applications")
    .select("id,id_image_path").eq("status", "pending").eq("id_required", true)
    .lte("created_at", pendingCutoff).is("id_deleted_at", null).limit(100);
  for (const application of pending ?? []) {
    if (application.id_image_path && !(await removeObject(application.id_image_path))) { counts.failures += 1; continue; }
    const { error } = await admin.from("homeowner_applications").update({
      status: "expired", expired_at: nowIso, id_image_path: null, id_deleted_at: nowIso,
    }).eq("id", application.id).eq("status", "pending");
    if (error) counts.failures += 1; else counts.pendingExpired += 1;
  }

  const { data: drafts = [] } = await admin.from("homeowner_id_upload_drafts")
    .select("id,storage_path").lte("expires_at", draftCutoff).is("consumed_at", null).limit(100);
  for (const draft of drafts ?? []) {
    if (!(await removeObject(draft.storage_path))) { counts.failures += 1; continue; }
    const { error } = await admin.from("homeowner_id_upload_drafts").delete().eq("id", draft.id).is("consumed_at", null);
    if (error) counts.failures += 1; else counts.draftsDeleted += 1;
  }

  await admin.from("homeowner_id_rate_limits").delete().lt("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000).toISOString());
  return Response.json({ ok: counts.failures === 0, ...counts }, { headers: { "cache-control": "no-store" } });
}
