import { describe, expect, it } from "vitest";

import { approvalVerificationError, subCommunities, validateApplication } from "./homeowner-applications";

function applicationForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const values = {
    full_name: "  Aaron   Tushabe ",
    email: " AARON@example.com ",
    phone: "+256 700 123 456",
    sub_community: "Bella Vista Apartments",
    unit_number: " BV 12 ",
    ...overrides,
  };
  Object.entries(values).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe("homeowner application validation", () => {
  it("lists the five fixed Pearl Marina communities", () => {
    expect(subCommunities).toEqual([
      "Bella Vista Apartments",
      "Mirabella and Signature Villas",
      "La Perla Bungalows",
      "Riviera Townhouses",
      "Kingswood Park",
    ]);
  });

  it("normalizes safe applicant input", () => {
    expect(validateApplication(applicationForm())).toEqual({
      data: {
        fullName: "Aaron Tushabe",
        email: "aaron@example.com",
        phone: "+256700123456",
        subCommunity: "Bella Vista Apartments",
        unitNumber: "BV 12",
      },
    });
  });

  it("rejects unknown communities and invalid phone numbers", () => {
    expect(validateApplication(applicationForm({ sub_community: "Other" }))).toHaveProperty("error");
    expect(validateApplication(applicationForm({ phone: "0700123456" }))).toHaveProperty("error");
  });

  it("limits unit numbers", () => {
    expect(validateApplication(applicationForm({ unit_number: "x".repeat(33) }))).toHaveProperty("error");
  });
});

describe("homeowner approval verification", () => {
  it("requires an ID comparison only when an ID was provided", () => {
    expect(approvalVerificationError({ idRequired: true, idCompared: false, emailOnFileConfirmed: true, idImageAvailable: true }))
      .toBe("id_verification_required");
    expect(approvalVerificationError({ idRequired: true, idCompared: true, emailOnFileConfirmed: false, idImageAvailable: true }))
      .toBeNull();
  });

  it("requires email-on-file confirmation when no ID was provided", () => {
    expect(approvalVerificationError({ idRequired: false, idCompared: true, emailOnFileConfirmed: false, idImageAvailable: false }))
      .toBe("email_verification_required");
    expect(approvalVerificationError({ idRequired: false, idCompared: false, emailOnFileConfirmed: true, idImageAvailable: false }))
      .toBeNull();
  });

  it("does not approve an ID-backed application after its image is unavailable", () => {
    expect(approvalVerificationError({ idRequired: true, idCompared: true, emailOnFileConfirmed: false, idImageAvailable: false }))
      .toBe("id_verification_required");
  });
});
