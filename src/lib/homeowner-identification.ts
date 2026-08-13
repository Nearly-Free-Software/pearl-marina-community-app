import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export {
  HOMEOWNER_ID_MAX_BYTES,
  HOMEOWNER_ID_MAX_DIMENSION,
  HOMEOWNER_ID_PRIVACY_VERSION,
} from "./homeowner-identification-shared";

export const HOMEOWNER_ID_BUCKET = "homeowner-identification";
export const HOMEOWNER_ID_DRAFT_HOURS = 24;

const NAME_VALUE = /^[\p{L}][\p{L}'’.-]*(?:\s+[\p{L}][\p{L}'’.-]*){0,5}$/u;
const LABELS = /^(?:FULL\s+NAME|NAME(?:S)?|SURNAME|FAMILY\s+NAME|LAST\s+NAME|GIVEN\s+NAME(?:S)?|FIRST\s+NAME)\s*[:\-]?\s*(.*)$/i;

export function isIdRequirementEnabled() {
  return process.env.HOMEOWNER_ID_REQUIREMENT_ENABLED === "true"
    && Boolean(process.env.GOOGLE_CLOUD_VISION_API_KEY)
    && Boolean(process.env.SIGNUP_RATE_LIMIT_SECRET);
}

export function classifyIdDraftCredentials(draftId: string, draftSecret: string) {
  if (!draftId && !draftSecret) return "none" as const;
  if (draftId && draftSecret) return "complete" as const;
  return "incomplete" as const;
}

export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function createDraftSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashDraftSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function draftSecretMatches(secret: string, expectedHash: string) {
  const actual = Buffer.from(hashDraftSecret(secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function keyedHash(value: string) {
  const secret = process.env.SIGNUP_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) throw new Error("Missing or weak SIGNUP_RATE_LIMIT_SECRET");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function cleanCandidate(value: string, allowSingle = false) {
  const candidate = value.replace(/\s+/g, " ").replace(/^[^\p{L}]+|[^\p{L}'’.-]+$/gu, "").trim();
  if (!NAME_VALUE.test(candidate) || candidate.length > 100 || (!allowSingle && !candidate.includes(" "))) return null;
  return candidate.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toUpperCase());
}

export function extractSuggestedName(rawText: string) {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let surname: string | null = null;
  let given: string | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(LABELS);
    if (!match) continue;
    const label = lines[index].toUpperCase();
    const inline = match[1]?.trim();
    const isPart = /SURNAME|FAMILY|LAST|GIVEN|FIRST/.test(label);
    const candidate = cleanCandidate(inline || lines[index + 1] || "", isPart);
    if (!candidate) continue;
    if (/SURNAME|FAMILY|LAST/.test(label)) surname = candidate;
    else if (/GIVEN|FIRST/.test(label)) given = candidate;
    else return candidate;
  }
  return cleanCandidate([given, surname].filter(Boolean).join(" "));
}

type VisionResponse = {
  responses?: Array<{ textAnnotations?: Array<{ description?: string }>; error?: { message?: string } }>;
};

export async function detectIdName(image: Blob) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) return { status: "failed" as const, suggestedName: null };
  const content = Buffer.from(await image.arrayBuffer()).toString("base64");
  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requests: [{ image: { content }, features: [{ type: "TEXT_DETECTION", maxResults: 1 }] }] }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return { status: "failed" as const, suggestedName: null };
  const result = await response.json() as VisionResponse;
  if (result.responses?.[0]?.error) return { status: "failed" as const, suggestedName: null };
  const suggestion = extractSuggestedName(result.responses?.[0]?.textAnnotations?.[0]?.description ?? "");
  return suggestion
    ? { status: "name_found" as const, suggestedName: suggestion }
    : { status: "no_name" as const, suggestedName: null };
}
