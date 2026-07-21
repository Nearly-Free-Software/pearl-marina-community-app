import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const roleLabels = { admin: "Administrator", homeowner: "Homeowner", resident: "Resident", service_provider: "Service provider" } as const;

export async function getAuthenticatedProfile(): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || profile.access_status !== "active") redirect("/login?error=access_denied");
  return profile;
}

export function authErrorMessage(code?: string | null) {
  if (code === "invalid_link") return "This sign-in link is invalid or has expired. Ask for a new link and try again.";
  if (code === "access_denied") return "Your community access is not active. Please contact the community administrator.";
  if (code === "email_not_confirmed") return "Please use the invitation email sent by the community administrator first.";
  return code ? "We could not sign you in. Please try again." : null;
}
