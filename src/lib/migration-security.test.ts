import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260721122153_create_profiles.sql"), "utf8");
const visitorMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260724123643_create_visitor_passes.sql"), "utf8");

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

describe("visitor pass migration security", () => {
  it("enables RLS and never grants anonymous table access", () => {
    expect(visitorMigration).toContain("alter table public.visitor_passes enable row level security");
    expect(visitorMigration).toContain("revoke all on table public.visitor_passes from anon, authenticated");
    expect(visitorMigration).not.toContain("grant select on table public.visitor_passes to anon");
  });

  it("limits browser updates to revocation and token replacement", () => {
    expect(visitorMigration).toContain("grant update (token_hash, revoked_at)");
    expect(visitorMigration).not.toContain("grant update on table public.visitor_passes");
  });

  it("returns a minimal public result and grants only the verification function", () => {
    expect(visitorMigration).toContain("function public.verify_visitor_pass");
    expect(visitorMigration).toContain("grant execute on function public.verify_visitor_pass(text) to anon, authenticated");
    expect(visitorMigration).not.toContain("guest_phone text,");
  });
});
