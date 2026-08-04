"use server";

import { redirect } from "next/navigation";

import { validateApplication } from "@/lib/homeowner-applications";
import {
  draftSecretMatches,
  HOMEOWNER_ID_PRIVACY_VERSION,
  isIdRequirementEnabled,
} from "@/lib/homeowner-identification";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitHomeownerApplication(formData: FormData) {
  const result = validateApplication(formData);
  if (!result.data) redirect(`/signup?error=${encodeURIComponent(result.error)}`);
  const application = result.data;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("homeowner_applications")
    .select("status")
    .eq("email", application.email)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (!existing) {
    const idRequired = isIdRequirementEnabled();
    let idFields = {};
    let consumedDraftId: string | null = null;
    if (idRequired) {
      const draftId = String(formData.get("id_draft_id") ?? "");
      const draftSecret = String(formData.get("id_draft_secret") ?? "");
      const privacyVersion = String(formData.get("privacy_acknowledged") ?? "");
      const { data: draft } = await supabase.from("homeowner_id_upload_drafts").select("*").eq("id", draftId).maybeSingle();
      if (!draft || draft.email !== application.email || draft.consumed_at || !draft.processed_at
        || new Date(draft.expires_at) <= new Date() || !draftSecretMatches(draftSecret, draft.token_hash)
        || privacyVersion !== HOMEOWNER_ID_PRIVACY_VERSION || !draft.mime_type || !draft.file_size) {
        redirect("/signup?error=Upload+a+valid+ID+and+confirm+the+privacy+notice.");
      }
      const now = new Date().toISOString();
      const { data: consumed } = await supabase.from("homeowner_id_upload_drafts")
        .update({ consumed_at: now }).eq("id", draft.id).is("consumed_at", null).select("id").maybeSingle();
      if (!consumed) redirect("/signup?error=This+ID+upload+was+already+used.+Upload+it+again.");
      consumedDraftId = draft.id;
      idFields = {
        id_required: true,
        id_image_path: draft.storage_path,
        id_image_mime_type: draft.mime_type,
        id_image_size: draft.file_size,
        id_ocr_status: draft.ocr_status,
        id_ocr_suggested_name: draft.ocr_suggested_name,
        name_confirmed_at: now,
        privacy_notice_version: HOMEOWNER_ID_PRIVACY_VERSION,
        privacy_accepted_at: now,
      };
    }
    const { error } = await supabase.from("homeowner_applications").insert({
      full_name: application.fullName,
      email: application.email,
      phone: application.phone,
      sub_community: application.subCommunity,
      unit_number: application.unitNumber,
      ...idFields,
    });
    if (error && consumedDraftId) {
      await supabase.from("homeowner_id_upload_drafts").update({ consumed_at: null }).eq("id", consumedDraftId);
    }
    if (error && error.code !== "23505") redirect("/signup?error=submission_failed");
    if (!error && consumedDraftId) await supabase.from("homeowner_id_upload_drafts").delete().eq("id", consumedDraftId);
  }

  redirect("/signup?submitted=1");
}
