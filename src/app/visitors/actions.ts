"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  canInviteGuests,
  createPassToken,
  hashPassToken,
  phonePattern,
  resolveValidityWindow,
  type DurationChoice,
} from "@/lib/visitors";

export type VisitorActionState = { error?: string };

export async function createVisitorPass(
  _state: VisitorActionState,
  formData: FormData,
): Promise<VisitorActionState> {
  const profile = await getAuthenticatedProfile();
  if (!canInviteGuests(profile.role)) return { error: "Your account cannot create visitor passes." };

  const guestName = String(formData.get("guest_name") ?? "").trim();
  const guestPhone = String(formData.get("guest_phone") ?? "").replace(/[\s()-]/g, "");
  const requestKey = String(formData.get("request_key") ?? "");
  const duration = String(formData.get("duration") ?? "") as DurationChoice;

  if (!guestName || guestName.length > 100) return { error: "Enter the guest’s name." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) {
    return { error: "This form has expired. Refresh the page and try again." };
  }
  if (!phonePattern.test(guestPhone)) {
    return { error: "Enter the phone number with its country code, for example +256700000000." };
  }
  if (!["today", "24_hours", "custom"].includes(duration)) {
    return { error: "Choose how long the guest should have access." };
  }

  let window: ReturnType<typeof resolveValidityWindow>;
  try {
    window = resolveValidityWindow(
      duration,
      new Date(),
      String(formData.get("custom_start") ?? ""),
      String(formData.get("custom_end") ?? ""),
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Choose a valid access period." };
  }

  const token = createPassToken();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visitor_passes")
    .insert({
      resident_id: profile.id,
      guest_name: guestName,
      guest_phone: guestPhone,
      request_key: requestKey,
      valid_from: window.validFrom.toISOString(),
      valid_until: window.validUntil.toISOString(),
      token_hash: hashPassToken(token),
      revoked_at: null,
    })
    .select("id")
    .single();

  if (error?.code === "23505") redirect("/visitors?duplicate=1");
  if (error || !data) return { error: "We could not create this pass. Please try again." };
  revalidatePath("/visitors");
  redirect(`/visitors/${data.id}?token=${encodeURIComponent(token)}&created=1`);
}

export async function replaceVisitorPassToken(passId: string) {
  await getAuthenticatedProfile();
  const token = createPassToken();
  const supabase = await createClient();
  const { data } = await supabase
    .from("visitor_passes")
    .update({ token_hash: hashPassToken(token), revoked_at: null })
    .eq("id", passId)
    .select("id")
    .maybeSingle();

  if (!data) redirect(`/visitors/${passId}?error=replace_failed`);
  revalidatePath(`/visitors/${passId}`);
  redirect(`/visitors/${passId}?token=${encodeURIComponent(token)}`);
}

export async function revokeVisitorPass(passId: string) {
  await getAuthenticatedProfile();
  const supabase = await createClient();
  await supabase
    .from("visitor_passes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", passId);
  revalidatePath("/visitors");
  revalidatePath(`/visitors/${passId}`);
  redirect(`/visitors/${passId}?revoked=1`);
}
