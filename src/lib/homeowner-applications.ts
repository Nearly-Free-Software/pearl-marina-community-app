import type { SubCommunity } from "@/types/database";

export const subCommunities = [
  "Bella Vista Apartments",
  "Mirabella and Signature Villas",
  "La Perla Bungalows",
  "Riviera Townhouses",
  "Kingswood Park",
] as const satisfies readonly SubCommunity[];

export const applicationPhonePattern = /^\+[1-9]\d{7,14}$/;

export type ApplicationInput = {
  fullName: string;
  email: string;
  phone: string;
  subCommunity: SubCommunity;
  unitNumber: string;
};

export function approvalVerificationError({
  idRequired,
  idCompared,
  emailOnFileConfirmed,
  idImageAvailable,
}: {
  idRequired: boolean;
  idCompared: boolean;
  emailOnFileConfirmed: boolean;
  idImageAvailable: boolean;
}) {
  if (idRequired && (!idCompared || !idImageAvailable)) return "id_verification_required" as const;
  if (!idRequired && !emailOnFileConfirmed) return "email_verification_required" as const;
  return null;
}

export function validateApplication(formData: FormData):
  | { data: ApplicationInput; error?: never }
  | { data?: never; error: string } {
  const fullName = String(formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim().replace(/[\s()-]/g, "");
  const subCommunity = String(formData.get("sub_community") ?? "") as SubCommunity;
  const unitNumber = String(formData.get("unit_number") ?? "").trim().replace(/\s+/g, " ");

  if (fullName.length < 2 || fullName.length > 100) return { error: "Enter your full name." };
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  if (!applicationPhonePattern.test(phone)) return { error: "Enter a phone number with its country code, for example +256…." };
  if (!subCommunities.includes(subCommunity)) return { error: "Choose your Pearl Marina community." };
  if (unitNumber.length < 1 || unitNumber.length > 32) return { error: "Enter a unit number of 32 characters or fewer." };

  return { data: { fullName, email, phone, subCommunity, unitNumber } };
}
