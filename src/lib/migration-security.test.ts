import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260721122153_create_profiles.sql"), "utf8");
const visitorMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260724123643_create_visitor_passes.sql"), "utf8");
const requestKeyMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260724131734_add_visitor_request_keys.sql"), "utf8");
const homeownerMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260724142031_homeowner_applications.sql"), "utf8");
const managerVisitorMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260804134454_allow_community_managers_visitor_passes.sql"), "utf8");
const homeownerIdMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260804180613_homeowner_id_verification.sql"), "utf8");
const visitorLinkMigration = readFileSync(join(process.cwd(), "supabase/migrations/20260806124724_store_encrypted_visitor_pass_links.sql"), "utf8");

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

describe("homeowner application migration security", () => {
  it("enables RLS without exposing applicant data anonymously", () => {
    expect(homeownerMigration).toContain("alter table public.homeowner_applications enable row level security");
    expect(homeownerMigration).toContain("revoke all on table public.homeowner_applications from anon, authenticated");
    expect(homeownerMigration).not.toContain("grant select on table public.homeowner_applications to anon");
  });

  it("limits reads to active community managers", () => {
    expect(homeownerMigration).toContain("profiles.role::text = 'community_manager'");
    expect(homeownerMigration).toContain("profiles.access_status = 'active'");
  });

  it("prevents duplicate open applications while allowing rejected applicants to reapply", () => {
    expect(homeownerMigration).toContain("where status in ('pending', 'approved')");
  });

  it("keeps browser clients from assigning roles or approving applications", () => {
    expect(homeownerMigration).not.toContain("grant update on table public.homeowner_applications");
    expect(homeownerMigration).not.toContain("grant insert on table public.homeowner_applications");
  });
});

describe("visitor request idempotency migration", () => {
  it("adds a required per-resident duplicate-prevention key", () => {
    expect(requestKeyMigration).toContain("alter column request_key set not null");
    expect(requestKeyMigration).toContain("unique (resident_id, request_key)");
  });

  it("does not expose or broaden browser permissions", () => {
    expect(requestKeyMigration).not.toContain("grant ");
    expect(requestKeyMigration).not.toContain("policy ");
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

describe("community manager visitor policy migration", () => {
  it("adds community managers to all three owner-scoped visitor policies", () => {
    expect(managerVisitorMigration.match(/'community_manager'/g)?.length).toBe(4);
    expect(managerVisitorMigration).toContain('alter policy "Inviters can read their own visitor passes"');
    expect(managerVisitorMigration).toContain('alter policy "Inviters can create their own visitor passes"');
    expect(managerVisitorMigration).toContain('alter policy "Inviters can revoke or replace their own visitor passes"');
  });

  it("retains ownership and active-account checks", () => {
    expect(managerVisitorMigration.match(/resident_id = \(select auth\.uid\(\)\)/g)?.length).toBe(4);
    expect(managerVisitorMigration.match(/profiles\.access_status = 'active'/g)?.length).toBe(4);
  });
});

describe("persistent visitor link migration security", () => {
  it("keeps encrypted bearer tokens out of browser roles", () => {
    expect(visitorLinkMigration).toContain("alter table public.visitor_pass_tokens enable row level security");
    expect(visitorLinkMigration).toContain("revoke all on table public.visitor_pass_tokens from anon, authenticated");
    expect(visitorLinkMigration).toContain("grant all on table public.visitor_pass_tokens to service_role");
  });
});

describe("homeowner identification migration security", () => {
  it("creates a private, JPEG-only bucket with a 1.5 MB limit", () => {
    expect(homeownerIdMigration).toContain("'homeowner-identification', 'homeowner-identification', false, 1572864");
    expect(homeownerIdMigration).toContain("array['image/jpeg']");
    expect(homeownerIdMigration).not.toContain("on storage.objects");
  });

  it("keeps drafts, rate limits, and access logs inaccessible to browser roles", () => {
    for (const table of ["homeowner_id_upload_drafts", "homeowner_id_rate_limits", "homeowner_id_access_log"]) {
      expect(homeownerIdMigration).toContain(`alter table public.${table} enable row level security`);
      expect(homeownerIdMigration).toContain(`revoke all on table public.${table} from public, anon, authenticated`);
    }
  });

  it("grandfathers existing applications and validates one-time token hashes", () => {
    expect(homeownerIdMigration).toContain("add column id_required boolean not null default false");
    expect(homeownerIdMigration).toContain("token_hash ~ '^[0-9a-f]{64}$'");
  });
});
