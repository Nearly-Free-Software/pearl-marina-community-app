import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  createDraftSecret,
  hashDraftSecret,
  HOMEOWNER_ID_BUCKET,
  isIdRequirementEnabled,
  keyedHash,
  normalizeEmail,
} from "@/lib/homeowner-identification";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function clientIp(request: Request) {
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export async function POST(request: Request) {
  if (!isIdRequirementEnabled()) return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = normalizeEmail(body?.email);
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Check the email address and try again." }, { status: 400 });
  }

  const admin = createAdminClient();
  const ipHash = keyedHash(clientIp(request));
  const emailHash = keyedHash(email);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();
  const [{ count: emailCount }, { count: ipCount }] = await Promise.all([
    admin.from("homeowner_id_rate_limits").select("id", { count: "exact", head: true }).eq("email_hash", emailHash).eq("event_type", "upload").gte("created_at", since),
    admin.from("homeowner_id_rate_limits").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).eq("event_type", "upload").gte("created_at", since),
  ]);
  if ((emailCount ?? 0) >= 3 || (ipCount ?? 0) >= 8) {
    return NextResponse.json({ error: "Please wait before trying another upload." }, { status: 429 });
  }

  const draftId = randomUUID();
  const draftSecret = createDraftSecret();
  const path = `drafts/${draftId}.jpg`;
  const { data: upload, error: uploadError } = await admin.storage.from(HOMEOWNER_ID_BUCKET).createSignedUploadUrl(path);
  if (uploadError || !upload) return NextResponse.json({ error: "Upload could not be prepared." }, { status: 503 });

  const { error } = await admin.from("homeowner_id_upload_drafts").insert({
    id: draftId,
    email,
    ip_hash: ipHash,
    storage_path: path,
    token_hash: hashDraftSecret(draftSecret),
  });
  if (error) return NextResponse.json({ error: "Upload could not be prepared." }, { status: 503 });
  await admin.from("homeowner_id_rate_limits").insert({ email_hash: emailHash, ip_hash: ipHash, event_type: "upload" });

  return NextResponse.json({ draftId, draftSecret, uploadPath: path, uploadToken: upload.token }, {
    headers: { "cache-control": "no-store" },
  });
}
