"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthenticatedProfile } from "@/lib/auth";
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
  if (!application || application.status === "rejected") redirect("/dashboard/applications?error=not_available");

  if (application.status === "pending" && application.id_required) {
    if (formData?.get("id_compared") !== "yes" || !application.id_image_path || application.id_deleted_at) {
      redirect("/dashboard/applications?error=id_verification_required");
    }
  }

  if (application.status === "pending") {
    const { error } = await admin.from("homeowner_applications").update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: manager.id,
      rejection_reason: null,
      invitation_error: null,
      id_verified_at: application.id_required ? new Date().toISOString() : null,
      id_verified_by: application.id_required ? manager.id : null,
      id_delete_after: application.id_required ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString() : null,
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
      options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/confirm` },
    });
    inviteError = error?.message ?? inviteError;
  }

  if (authUser) {
    await admin.from("profiles").update({
      display_name: application.full_name,
      email: application.email,
      phone: application.phone,
      sub_community: application.sub_community,
      unit_number: application.unit_number,
      role: "homeowner",
      access_status: "active",
    }).eq("id", authUser.id);
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
  const { data: application } = await admin.from("homeowner_applications").select("id_required").eq("id", applicationId).maybeSingle();
  if (!application) redirect("/dashboard/applications?error=not_available");
  const { error } = await admin.from("homeowner_applications").update({
    status: "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: manager.id,
    rejection_reason: reason,
    invitation_error: null,
    id_delete_after: application.id_required ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString() : null,
  }).eq("id", applicationId).eq("status", "pending");
  if (error) redirect("/dashboard/applications?error=rejection_failed");
  revalidatePath("/dashboard/applications");
  redirect("/dashboard/applications?rejected=1");
}
