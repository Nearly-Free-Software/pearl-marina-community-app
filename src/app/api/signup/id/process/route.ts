import { NextResponse } from "next/server";

import {
  detectIdName,
  draftSecretMatches,
  HOMEOWNER_ID_BUCKET,
  HOMEOWNER_ID_MAX_BYTES,
  isIdRequirementEnabled,
  keyedHash,
} from "@/lib/homeowner-identification";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!isIdRequirementEnabled()) return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  const body = await request.json().catch(() => null) as { draftId?: string; draftSecret?: string } | null;
  if (!body?.draftId || !body.draftSecret) return NextResponse.json({ error: "Upload is no longer valid." }, { status: 400 });
  const admin = createAdminClient();
  const { data: draft } = await admin.from("homeowner_id_upload_drafts").select("*").eq("id", body.draftId).maybeSingle();
  if (!draft || draft.consumed_at || new Date(draft.expires_at) <= new Date() || !draftSecretMatches(body.draftSecret, draft.token_hash)) {
    return NextResponse.json({ error: "Upload is no longer valid." }, { status: 400 });
  }
  if (draft.processed_at) {
    return NextResponse.json({ ocrStatus: draft.ocr_status, suggestedName: draft.ocr_suggested_name }, {
      headers: { "cache-control": "no-store" },
    });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
  const [{ count: draftCount }, { count: globalCount }] = await Promise.all([
    admin.from("homeowner_id_rate_limits").select("id", { count: "exact", head: true }).eq("email_hash", keyedHash(draft.email)).eq("event_type", "ocr").gte("created_at", since),
    admin.from("homeowner_id_rate_limits").select("id", { count: "exact", head: true }).eq("event_type", "ocr").gte("created_at", since),
  ]);
  const { data: image, error } = await admin.storage.from(HOMEOWNER_ID_BUCKET).download(draft.storage_path);
  if (error || !image || image.size < 1 || image.size > HOMEOWNER_ID_MAX_BYTES || image.type !== "image/jpeg") {
    return NextResponse.json({ error: "Upload a valid processed JPEG image." }, { status: 400 });
  }
  const limited = (draftCount ?? 0) >= 3 || (globalCount ?? 0) >= 50;
  if (!limited) await admin.from("homeowner_id_rate_limits").insert({
    email_hash: keyedHash(draft.email), ip_hash: draft.ip_hash, event_type: "ocr",
  });

  const result = limited
    ? { status: "failed" as const, suggestedName: null }
    : await detectIdName(image).catch(() => ({ status: "failed" as const, suggestedName: null }));
  await admin.from("homeowner_id_upload_drafts").update({
    mime_type: "image/jpeg",
    file_size: image.size,
    ocr_status: result.status,
    ocr_suggested_name: result.suggestedName,
    processed_at: new Date().toISOString(),
  }).eq("id", draft.id).is("consumed_at", null);

  return NextResponse.json({ ocrStatus: result.status, suggestedName: result.suggestedName }, {
    headers: { "cache-control": "no-store" },
  });
}
