"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthenticatedProfile } from "@/lib/auth";
import { approvalVerificationError, homeownerApprovalRedirect, validateManagerPropertyDetails } from "@/lib/homeowner-applications";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireManager() {
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "community_manager") redirect("/dashboard");
  return profile;
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user || data.users.length < 100) return user ?? null;
  }
  return null;
}

export async function approveHomeownerApplication(applicationId: string, formData?: FormData) {
  const manager = await requireManager();
  const admin = createAdminClient();
  const { data: application } = await admin.from("homeowner_applications").select("*").eq("id", applicationId).maybeSingle();
  if (!application || application.status === "rejected" || application.anonymized_at || !application.email || !application.full_name || !application.phone || !application.sub_community || !application.unit_number) redirect("/dashboard/applications?error=not_available");

  let approvedSubCommunity = application.sub_community;
  let approvedUnitNumber = application.unit_number;
  if (application.status === "pending") {
    if (!formData) redirect("/dashboard/applications?error=property_details_invalid");
    const propertyDetails = validateManagerPropertyDetails(formData);
    if (!propertyDetails.data) redirect("/dashboard/applications?error=property_details_invalid");
    approvedSubCommunity = propertyDetails.data.subCommunity;
    approvedUnitNumber = propertyDetails.data.unitNumber;
    const verificationError = approvalVerificationError({
      idRequired: application.id_required,
      idCompared: formData?.get("id_compared") === "yes",
      emailOnFileConfirmed: formData?.get("email_on_file_confirmed") === "yes",
      idImageAvailable: Boolean(application.id_image_path && !application.id_deleted_at),
    });
    if (verificationError) redirect(`/dashboard/applications?error=${verificationError}`);
  }

  const decisionAt = new Date().toISOString();
  if (application.status === "pending") {
    const { error } = await admin.from("homeowner_applications").update({
      status: "approved",
      reviewed_at: decisionAt,
      reviewed_by: manager.id,
      rejection_reason: null,
      invitation_error: null,
      sub_community: approvedSubCommunity,
      unit_number: approvedUnitNumber,
      id_verified_at: application.id_required ? new Date().toISOString() : null,
      id_verified_by: application.id_required ? manager.id : null,
      id_delete_after: application.id_required ? decisionAt : null,
    }).eq("id", application.id).eq("status", "pending");
    if (error) redirect("/dashboard/applications?error=approval_failed");
  }

  let authUser = application.auth_user_id
    ? (await admin.auth.admin.getUserById(application.auth_user_id)).data.user
    : await findAuthUserByEmail(application.email);
  let inviteError: string | null = null;

  if (!authUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email: application.email,
      email_confirm: true,
      user_metadata: { display_name: application.full_name },
    });
    authUser = data.user;
    inviteError = error?.message ?? null;
  }

  if (authUser && !application.invitation_sent_at) {
    const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { error } = await admin.auth.signInWithOtp({
      email: application.email,
      options: { shouldCreateUser: false, emailRedirectTo: homeownerApprovalRedirect(origin) },
    });
    inviteError = error?.message ?? inviteError;
  }

  if (authUser) {
    await admin.from("profiles").update({
      display_name: application.full_name,
      email: application.email,
      phone: application.phone,
      sub_community: approvedSubCommunity,
      unit_number: approvedUnitNumber,
      role: "homeowner",
      access_status: "active",
    }).eq("id", authUser.id);
  }

  if (application.id_required && application.id_image_path && !application.id_deleted_at) {
    const { error: storageError } = await admin.storage.from("homeowner-identification").remove([application.id_image_path]);
    if (!storageError) {
      await admin.from("homeowner_applications").update({ id_image_path: null, id_deleted_at: decisionAt }).eq("id", application.id);
    }
  }

  await admin.from("homeowner_applications").update({
    auth_user_id: authUser?.id ?? null,
    invitation_sent_at: inviteError ? null : new Date().toISOString(),
    invitation_error: inviteError?.slice(0, 500) ?? null,
  }).eq("id", application.id);

  revalidatePath("/dashboard/applications");
  redirect(inviteError ? "/dashboard/applications?error=invitation_failed" : "/dashboard/applications?approved=1");
}

export async function rejectHomeownerApplication(applicationId: string, formData: FormData) {
  const manager = await requireManager();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;
  const admin = createAdminClient();
  const { data: application } = await admin.from("homeowner_applications").select("id_required,id_image_path,id_deleted_at").eq("id", applicationId).maybeSingle();
  if (!application) redirect("/dashboard/applications?error=not_available");
  const decisionAt = new Date().toISOString();
  const { error } = await admin.from("homeowner_applications").update({
    status: "rejected",
    reviewed_at: decisionAt,
    reviewed_by: manager.id,
    rejection_reason: reason,
    invitation_error: null,
    id_delete_after: application.id_required ? decisionAt : null,
  }).eq("id", applicationId).eq("status", "pending");
  if (error) redirect("/dashboard/applications?error=rejection_failed");
  if (application.id_required && application.id_image_path && !application.id_deleted_at) {
    const { error: storageError } = await admin.storage.from("homeowner-identification").remove([application.id_image_path]);
    if (!storageError) {
      await admin.from("homeowner_applications").update({ id_image_path: null, id_deleted_at: decisionAt }).eq("id", applicationId);
    }
  }
  revalidatePath("/dashboard/applications");
  redirect("/dashboard/applications?rejected=1");
}
