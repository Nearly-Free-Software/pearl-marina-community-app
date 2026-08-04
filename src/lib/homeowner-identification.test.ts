import { describe, expect, it } from "vitest";
import { extractSuggestedName } from "./homeowner-identification";

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
