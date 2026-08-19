import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteAccountForm } from "./delete-account-form";

vi.mock("./actions", () => ({
  deleteAccount: vi.fn(async () => ({ error: null })),
}));

describe("DeleteAccountForm", () => {
  it("requires the displayed account email before permanent deletion", async () => {
    const user = userEvent.setup();
    render(<DeleteAccountForm email="resident@example.com" />);

    const email = screen.getByLabelText("Enter resident@example.com to confirm");
    expect(email).toBeRequired();
    expect(email).toHaveAttribute("autocomplete", "off");
    expect(screen.getByRole("button", { name: "Delete my account permanently" })).toBeInTheDocument();

    await user.type(email, "resident@example.com");
    expect(email).toHaveValue("resident@example.com");
  });
});
