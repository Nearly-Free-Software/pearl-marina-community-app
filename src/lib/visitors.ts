import { createHash, randomBytes } from "node:crypto";

import type { CommunityRole, VisitorPassVerification } from "@/types/database";

export type DurationChoice = "today" | "24_hours" | "custom";

export const inviterRoles: CommunityRole[] = ["admin", "homeowner", "resident"];
export const phonePattern = /^\+[1-9]\d{7,14}$/;

export function canInviteGuests(role: CommunityRole) {
  return inviterRoles.includes(role);
}

export function createPassToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPassToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function parseKampalaDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}:00+03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveValidityWindow(
  duration: DurationChoice,
  now = new Date(),
  customStart?: string,
  customEnd?: string,
) {
  if (duration === "today") {
    const kampalaNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const validUntil = new Date(
      Date.UTC(
        kampalaNow.getUTCFullYear(),
        kampalaNow.getUTCMonth(),
        kampalaNow.getUTCDate(),
        20,
        59,
        59,
        999,
      ),
    );
    if (validUntil <= now) throw new Error("Today has already ended.");
    return { validFrom: now, validUntil };
  }

  if (duration === "24_hours") {
    return { validFrom: now, validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
  }

  const validFrom = parseKampalaDateTime(customStart ?? "");
  const validUntil = parseKampalaDateTime(customEnd ?? "");
  if (!validFrom || !validUntil) throw new Error("Choose a valid start and end time.");
  if (validFrom.getTime() < now.getTime() - 5 * 60 * 1000) {
    throw new Error("The start time cannot be in the past.");
  }
  if (validUntil <= validFrom) throw new Error("The end time must be after the start time.");
  if (validUntil.getTime() - validFrom.getTime() > 31 * 24 * 60 * 60 * 1000) {
    throw new Error("A visitor pass cannot be longer than 31 days.");
  }
  return { validFrom, validUntil };
}

export function passDisplayStatus(pass: {
  valid_from: string;
  valid_until: string;
  revoked_at: string | null;
}, now = new Date()) {
  if (pass.revoked_at) return "Revoked";
  if (new Date(pass.valid_from) > now) return "Upcoming";
  if (new Date(pass.valid_until) < now) return "Expired";
  return "Active";
}

export const verificationCopy: Record<
  VisitorPassVerification["status"],
  { label: string; heading: string; description: string; tone: "success" | "warning" | "danger" }
> = {
  valid: {
    label: "Valid",
    heading: "Visitor pass is valid",
    description: "This guest may enter during the access period shown below.",
    tone: "success",
  },
  not_yet_valid: {
    label: "Not active yet",
    heading: "Access has not started",
    description: "This pass will become valid at the start time shown below.",
    tone: "warning",
  },
  expired: {
    label: "Expired",
    heading: "Visitor pass has expired",
    description: "This pass is no longer valid for entry.",
    tone: "danger",
  },
  revoked: {
    label: "Revoked",
    heading: "Visitor pass was revoked",
    description: "The resident cancelled this pass. Do not admit the visitor.",
    tone: "danger",
  },
  invalid: {
    label: "Not valid",
    heading: "Pass not valid",
    description: "This code is invalid or no longer available. Ask the resident to create a new pass.",
    tone: "danger",
  },
};

export function formatKampalaDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Kampala",
  }).format(new Date(value));
}
