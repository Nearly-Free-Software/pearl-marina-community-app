import { describe, expect, it } from "vitest";
import { authErrorMessage, roleLabels } from "./auth";

describe("authentication helpers", () => {
  it("provides a label for every community role", () => {
    expect(roleLabels).toEqual({
      admin: "Administrator",
      community_manager: "Community manager",
      homeowner: "Homeowner",
      resident: "Resident",
      service_provider: "Service provider",
    });
  });

  it("maps expired links and inactive access to safe messages", () => {
    expect(authErrorMessage("invalid_link")).toContain("expired");
    expect(authErrorMessage("access_denied")).toContain("not active");
    expect(authErrorMessage("unexpected")).not.toContain("unexpected");
  });
});
