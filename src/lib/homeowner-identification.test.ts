import { describe, expect, it } from "vitest";
import { classifyIdDraftCredentials, extractSuggestedName } from "./homeowner-identification";

describe("optional government ID drafts", () => {
  it("distinguishes an omitted upload from complete and forged partial credentials", () => {
    expect(classifyIdDraftCredentials("", "")).toBe("none");
    expect(classifyIdDraftCredentials("draft-id", "draft-secret")).toBe("complete");
    expect(classifyIdDraftCredentials("draft-id", "")).toBe("incomplete");
    expect(classifyIdDraftCredentials("", "draft-secret")).toBe("incomplete");
  });
});

describe("government ID name extraction", () => {
  it("extracts a full name printed after a label", () => {
    expect(extractSuggestedName("REPUBLIC OF UGANDA\nFULL NAME: AARON TUSHABE\nNIN CM123"))
      .toBe("Aaron Tushabe");
  });

  it("combines passport surname and given names", () => {
    expect(extractSuggestedName("PASSPORT\nSurname\nIRADUKUNDA\nGiven names\nGERALD PETER"))
      .toBe("Gerald Peter Iradukunda");
  });

  it("does not guess from unlabeled text or return an ID number", () => {
    expect(extractSuggestedName("UGANDA\nCM940001234\n01 JAN 1990")).toBeNull();
  });
});
