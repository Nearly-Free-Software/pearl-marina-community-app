import { describe, expect, it } from "vitest";

import {
  canInviteGuests,
  hashPassToken,
  passDisplayStatus,
  phonePattern,
  resolveValidityWindow,
  verificationCopy,
} from "./visitors";

describe("visitor pass helpers", () => {
  it("allows community members but not service providers to invite guests", () => {
    expect(canInviteGuests("resident")).toBe(true);
    expect(canInviteGuests("homeowner")).toBe(true);
    expect(canInviteGuests("admin")).toBe(true);
    expect(canInviteGuests("service_provider")).toBe(false);
  });

  it("accepts international phone numbers only", () => {
    expect(phonePattern.test("+256700000000")).toBe(true);
    expect(phonePattern.test("0700000000")).toBe(false);
  });

  it("hashes bearer tokens without retaining their value", () => {
    const hash = hashPassToken("secret-token");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("secret-token");
  });

  it("creates a 24-hour window", () => {
    const now = new Date("2026-07-24T09:00:00.000Z");
    const window = resolveValidityWindow("24_hours", now);
    expect(window.validFrom).toEqual(now);
    expect(window.validUntil.toISOString()).toBe("2026-07-25T09:00:00.000Z");
  });

  it("ends today's pass at 23:59:59 in Kampala", () => {
    const window = resolveValidityWindow("today", new Date("2026-07-24T09:00:00.000Z"));
    expect(window.validUntil.toISOString()).toBe("2026-07-24T20:59:59.999Z");
  });

  it("rejects invalid custom windows", () => {
    expect(() =>
      resolveValidityWindow(
        "custom",
        new Date("2026-07-24T09:00:00.000Z"),
        "2026-07-24T14:00",
        "2026-07-24T13:00",
      ),
    ).toThrow("after");
  });

  it("maps current, upcoming, expired, and revoked passes", () => {
    const now = new Date("2026-07-24T09:00:00.000Z");
    expect(passDisplayStatus({ valid_from: "2026-07-24T08:00:00Z", valid_until: "2026-07-24T10:00:00Z", revoked_at: null }, now)).toBe("Active");
    expect(passDisplayStatus({ valid_from: "2026-07-24T10:00:00Z", valid_until: "2026-07-24T11:00:00Z", revoked_at: null }, now)).toBe("Upcoming");
    expect(passDisplayStatus({ valid_from: "2026-07-24T07:00:00Z", valid_until: "2026-07-24T08:00:00Z", revoked_at: null }, now)).toBe("Expired");
    expect(passDisplayStatus({ valid_from: "2026-07-24T08:00:00Z", valid_until: "2026-07-24T10:00:00Z", revoked_at: "2026-07-24T08:30:00Z" }, now)).toBe("Revoked");
  });

  it("uses safe public copy for invalid passes", () => {
    expect(verificationCopy.invalid.description).not.toContain("guest");
    expect(verificationCopy.valid.label).toBe("Valid");
  });

  it("keeps duplicate request identifiers out of public verification copy", () => {
    expect(JSON.stringify(verificationCopy)).not.toContain("request_key");
  });
});
