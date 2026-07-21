import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260721122153_create_profiles.sql"), "utf8");

describe("profiles migration security", () => {
  it("enables RLS and limits browser updates to display_name", () => {
    expect(migration).toContain("alter table public.profiles enable row level security");
    expect(migration).toContain("grant update (display_name)");
    expect(migration).not.toContain("grant update on table public.profiles");
  });

  it("requires ownership and active access in read and update policies", () => {
    expect(migration.match(/\(select auth\.uid\(\)\) = id/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration.match(/access_status = 'active'/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the auth trigger function out of exposed schemas", () => {
    expect(migration).toContain("function private.create_profile_for_new_user");
    expect(migration).toContain("revoke all on function private.create_profile_for_new_user()");
  });
});
