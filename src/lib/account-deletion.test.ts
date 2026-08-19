import { describe, expect, it } from "vitest";

import { accountDeletionError } from "./account-deletion";

describe("account deletion validation", () => {
  it.each(["homeowner", "resident", "service_provider"] as const)("allows %s with a matching email", (role) => {
    expect(accountDeletionError({ role, accountEmail: "person@example.com", confirmationEmail: " Person@Example.com " })).toBeNull();
  });

  it("requires the signed-in account email", () => {
    expect(accountDeletionError({ role: "resident", accountEmail: "person@example.com", confirmationEmail: "other@example.com" })).toContain("exactly");
    expect(accountDeletionError({ role: "resident", accountEmail: "person@example.com", confirmationEmail: "" })).toContain("exactly");
  });

  it.each(["admin", "community_manager"] as const)("blocks privileged %s accounts", (role) => {
    expect(accountDeletionError({ role, accountEmail: "person@example.com", confirmationEmail: "person@example.com" })).toContain("trusted system administrator");
  });
});
