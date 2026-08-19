"use server";

import { redirect, RedirectType } from "next/navigation";

import { accountDeletionError, type DeleteAccountState } from "@/lib/account-deletion";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const DELETE_ERROR = "We could not delete your account. No account access was changed; please try again.";

export async function deleteAccount(
  _previousState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Your session has expired. Sign in again before deleting your account." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role,access_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.access_status !== "active") {
    return { error: "Your account is not eligible for self-service deletion. Contact a trusted system administrator." };
  }

  const validationError = accountDeletionError({
    role: profile.role,
    accountEmail: profile.email,
    confirmationEmail: String(formData.get("email") ?? ""),
  });
  if (validationError) return { error: validationError };

  const admin = createAdminClient();
  const { data: applications, error: applicationError } = await admin
    .from("homeowner_applications")
    .select("id,id_image_path")
    .eq("auth_user_id", user.id);

  if (applicationError) {
    console.error("Account deletion preflight failed", { code: applicationError.code });
    return { error: DELETE_ERROR };
  }

  const imagePaths = (applications ?? []).flatMap((application) =>
    application.id_image_path ? [application.id_image_path] : [],
  );
  if (imagePaths.length > 0) {
    const { error: storageError } = await admin.storage.from("homeowner-identification").remove(imagePaths);
    if (storageError) {
      console.error("Account deletion storage cleanup failed", { name: storageError.name });
      return { error: DELETE_ERROR };
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
  if (deleteError) {
    console.error("Account deletion failed", { code: deleteError.code });
    return { error: DELETE_ERROR };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?account_deleted=1", RedirectType.replace);
}
