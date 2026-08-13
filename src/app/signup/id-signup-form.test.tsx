import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IdSignupForm } from "./id-signup-form";

vi.mock("./actions", () => ({
  submitHomeownerApplication: vi.fn(),
}));

describe("IdSignupForm", () => {
  it("allows an application without an ID and explains when one is required", () => {
    render(<IdSignupForm supabase={{ url: "https://example.supabase.co", publishableKey: "test-key" }} />);

    expect(screen.getByLabelText("Full name")).toBeEnabled();
    expect(screen.getByLabelText(/Government-issued photo ID/)).not.toBeRequired();
    expect(screen.queryByRole("checkbox", { name: /ID privacy notice/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit application" })).toBeEnabled();
    expect(screen.getByText(/new or different email address, include a government-issued photo ID/i)).toBeVisible();
  });
});
