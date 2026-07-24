"use server";

import { redirect } from "next/navigation";

import { validateApplication } from "@/lib/homeowner-applications";
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
    const { error } = await supabase.from("homeowner_applications").insert({
      full_name: application.fullName,
      email: application.email,
      phone: application.phone,
      sub_community: application.subCommunity,
      unit_number: application.unitNumber,
    });
    if (error && error.code !== "23505") redirect("/signup?error=submission_failed");
  }

  redirect("/signup?submitted=1");
}
