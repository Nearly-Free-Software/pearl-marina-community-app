import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteUser: vi.fn(),
  getUser: vi.fn(),
  profileResult: { data: null as Record<string, unknown> | null, error: null as Record<string, unknown> | null },
  applicationsResult: { data: [] as Array<{ id: string; id_image_path: string | null }>, error: null as Record<string, unknown> | null },
  remove: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  RedirectType: { replace: "replace" },
  redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser, signOut: mocks.signOut },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => mocks.profileResult) })),
      })),
    })),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { deleteUser: mocks.deleteUser } },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(async () => mocks.applicationsResult) })),
    })),
    storage: { from: vi.fn(() => ({ remove: mocks.remove })) },
  })),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { deleteAccount } from "./actions";

describe("deleteAccount server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.profileResult = { data: { id: "user-1", email: "person@example.com", role: "homeowner", access_status: "active" }, error: null };
    mocks.applicationsResult = { data: [], error: null };
    mocks.remove.mockResolvedValue({ error: null });
    mocks.deleteUser.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("rejects a mismatched email before creating an admin client", async () => {
    const formData = new FormData();
    formData.set("email", "other@example.com");

    await expect(deleteAccount({ error: null }, formData)).resolves.toEqual({
      error: "Enter your account email address exactly as shown to confirm deletion.",
    });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects privileged accounts", async () => {
    mocks.profileResult.data = { id: "user-1", email: "person@example.com", role: "community_manager", access_status: "active" };
    const formData = new FormData();
    formData.set("email", "person@example.com");

    await expect(deleteAccount({ error: null }, formData)).resolves.toEqual({
      error: "Administrator and community manager accounts must be removed by a trusted system administrator.",
    });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("removes identification images, permanently deletes Auth, and clears the local session", async () => {
    mocks.applicationsResult.data = [{ id: "application-1", id_image_path: "applications/id.jpg" }];
    const formData = new FormData();
    formData.set("email", "PERSON@example.com");

    await expect(deleteAccount({ error: null }, formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.remove).toHaveBeenCalledWith(["applications/id.jpg"]);
    expect(mocks.deleteUser).toHaveBeenCalledWith("user-1", false);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("keeps Auth intact when Storage cleanup fails", async () => {
    mocks.applicationsResult.data = [{ id: "application-1", id_image_path: "applications/id.jpg" }];
    mocks.remove.mockResolvedValue({ error: { name: "StorageError" } });
    const formData = new FormData();
    formData.set("email", "person@example.com");

    await expect(deleteAccount({ error: null }, formData)).resolves.toEqual({
      error: "We could not delete your account. No account access was changed; please try again.",
    });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
