"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";
import { HOMEOWNER_ID_MAX_BYTES, HOMEOWNER_ID_MAX_DIMENSION, HOMEOWNER_ID_PRIVACY_VERSION } from "@/lib/homeowner-identification-shared";
import { subCommunities } from "@/lib/homeowner-applications";
import { submitHomeownerApplication } from "./actions";
import { FieldRequirement, FormRequirementLegend } from "./field-requirement";

async function prepareIdImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, HOMEOWNER_ID_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) { bitmap.close(); throw new Error("This browser could not prepare the image."); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.88, 0.78, 0.68, 0.58]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= HOMEOWNER_ID_MAX_BYTES) return blob;
  }
  throw new Error("This image remains too large. Move closer to the ID and try again.");
}

export function IdSignupForm({ error, supabase: supabaseEnv }: {
  error?: string;
  supabase: { url: string; publishableKey: string };
}) {
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState<{ id: string; secret: string } | null>(null);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function clearDraft() {
    setDraft(null);
    setSuggestedName(null);
    setOcrStatus(null);
  }

  async function uploadId(file: File) {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return setUploadError("Enter your email address before uploading your ID.");
    setBusy(true);
    setUploadError(null);
    clearDraft();
    try {
      const image = await prepareIdImage(file);
      const issue = await fetch("/api/signup/id/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: normalizedEmail }) });
      const issued = await issue.json() as { error?: string; draftId?: string; draftSecret?: string; uploadPath?: string; uploadToken?: string };
      if (!issue.ok || !issued.draftId || !issued.draftSecret || !issued.uploadPath || !issued.uploadToken) throw new Error(issued.error || "Upload could not be prepared.");
      const supabase = createClient(supabaseEnv.url, supabaseEnv.publishableKey);
      const { error: storageError } = await supabase.storage.from("homeowner-identification")
        .uploadToSignedUrl(issued.uploadPath, issued.uploadToken, image, { contentType: "image/jpeg", cacheControl: "0" });
      if (storageError) throw new Error("The image could not be uploaded.");
      const processResponse = await fetch("/api/signup/id/process", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ draftId: issued.draftId, draftSecret: issued.draftSecret }) });
      const processed = await processResponse.json() as { error?: string; ocrStatus?: string; suggestedName?: string | null };
      if (!processResponse.ok) throw new Error(processed.error || "The image could not be processed.");
      setDraft({ id: issued.draftId, secret: issued.draftSecret });
      setSuggestedName(processed.suggestedName ?? null);
      setOcrStatus(processed.ocrStatus ?? "failed");
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submitHomeownerApplication} className="space-y-4">
      <FormRequirementLegend />
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email address<FieldRequirement kind="required" /></label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => { setEmail(event.target.value); if (draft) clearDraft(); }} required />
        <p className="text-xs leading-5 text-muted-foreground">Use the email address PMEL has on file for you. If you are applying with a new or different email address, include a government-issued photo ID below.</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="government_id" className="text-sm font-medium">Government-issued photo ID<FieldRequirement kind="conditional" /></label>
        <Input id="government_id" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadId(file); else clearDraft(); }} />
        <p className="text-xs leading-5 text-muted-foreground">You may leave this blank when using the email PMEL already has on file. Uploaded images are resized and stripped of image metadata.</p>
        {busy ? <p className="text-sm text-primary" role="status">Preparing your ID and reading the name…</p> : null}
        {draft ? <p className="text-sm text-emerald-700" role="status">ID uploaded. Confirm the name below.</p> : null}
        {uploadError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{uploadError}</p> : null}
      </div>
      <input type="hidden" name="id_draft_id" value={draft?.id ?? ""} />
      <input type="hidden" name="id_draft_secret" value={draft?.secret ?? ""} />
      <div className="space-y-2"><label htmlFor="full_name" className="text-sm font-medium">Full name<FieldRequirement kind="required" /></label><Input id="full_name" name="full_name" autoComplete="name" maxLength={100} defaultValue={suggestedName ?? ""} key={suggestedName ?? ocrStatus ?? "name"} required />{ocrStatus === "name_found" ? <p className="text-xs text-muted-foreground">We suggested this from the image. Correct it if needed.</p> : draft ? <p className="text-xs text-amber-800">We could not confidently find the name. Enter it manually; a manager will compare it with the ID.</p> : null}</div>
      <div className="space-y-2"><label htmlFor="phone" className="text-sm font-medium">Phone number<FieldRequirement kind="required" /></label><Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+256…" required /><p className="text-xs text-muted-foreground">Include the country code.</p></div>
      <div className="space-y-2"><label htmlFor="sub_community" className="text-sm font-medium">Community<FieldRequirement kind="required" /></label><select id="sub_community" name="sub_community" className="flex h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" defaultValue="" required><option value="" disabled>Select your community</option>{subCommunities.map((community) => <option key={community} value={community}>{community}</option>)}</select></div>
      <div className="space-y-2"><label htmlFor="unit_number" className="text-sm font-medium">Unit number<FieldRequirement kind="required" /></label><Input id="unit_number" name="unit_number" autoComplete="off" maxLength={32} required /></div>
      {draft ? <label className="flex items-start gap-3 rounded-lg border p-3 text-sm leading-6"><input type="checkbox" name="privacy_acknowledged" value={HOMEOWNER_ID_PRIVACY_VERSION} className="mt-1 size-5 shrink-0 accent-primary" required /><span>I have read the <Link href="/privacy/homeowner-id" target="_blank" className="font-medium text-primary underline">ID privacy notice</Link> and consent to this processing and retention.</span></label> : null}
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
      <PendingButton className="w-full" pendingLabel="Submitting application…" disabled={busy}>Submit application</PendingButton>
      <p className="text-center text-sm text-muted-foreground">Already approved? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link></p>
    </form>
  );
}
