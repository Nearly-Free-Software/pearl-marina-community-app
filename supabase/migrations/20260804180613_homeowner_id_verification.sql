alter type public.homeowner_application_status add value if not exists 'expired';

create type public.homeowner_id_ocr_status as enum (
  'pending',
  'name_found',
  'no_name',
  'failed'
);

alter table public.homeowner_applications
  drop constraint homeowner_applications_check,
  add column id_required boolean not null default false,
  add column id_image_path text,
  add column id_image_mime_type text,
  add column id_image_size integer,
  add column id_ocr_status public.homeowner_id_ocr_status,
  add column id_ocr_suggested_name text,
  add column name_confirmed_at timestamptz,
  add column privacy_notice_version text,
  add column privacy_accepted_at timestamptz,
  add column id_verified_at timestamptz,
  add column id_verified_by uuid references auth.users(id) on delete set null,
  add column id_delete_after timestamptz,
  add column id_deleted_at timestamptz,
  add column expired_at timestamptz,
  add constraint homeowner_application_id_metadata_check check (
    (id_required = false)
    or (
      id_image_path is not null
      and id_image_mime_type = 'image/jpeg'
      and id_image_size between 1 and 1572864
      and id_ocr_status is not null
      and name_confirmed_at is not null
      and privacy_notice_version is not null
      and privacy_accepted_at is not null
    )
  ),
  add constraint homeowner_application_verification_check check (
    (id_verified_at is null and id_verified_by is null)
    or (id_verified_at is not null and id_verified_by is not null)
  ),
  add constraint homeowner_application_deletion_check check (
    id_deleted_at is null or id_image_path is null
  ),
  add constraint homeowner_application_review_state_check check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null and expired_at is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null and expired_at is null)
    or (status::text = 'expired' and expired_at is not null)
  );

create table public.homeowner_id_upload_drafts (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(trim(email)) and char_length(email) <= 254),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  storage_path text not null unique check (storage_path ~ '^drafts/[0-9a-f-]{36}\.jpg$'),
  mime_type text,
  file_size integer check (file_size is null or file_size between 1 and 1572864),
  ocr_status public.homeowner_id_ocr_status not null default 'pending',
  ocr_suggested_name text check (ocr_suggested_name is null or char_length(ocr_suggested_name) between 2 and 100),
  processed_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homeowner_id_upload_drafts_expiry_idx
on public.homeowner_id_upload_drafts (expires_at)
where consumed_at is null;

create table public.homeowner_id_rate_limits (
  id bigint generated always as identity primary key,
  email_hash text not null check (email_hash ~ '^[0-9a-f]{64}$'),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  event_type text not null check (event_type in ('upload', 'ocr')),
  created_at timestamptz not null default now()
);

create index homeowner_id_rate_limits_email_idx on public.homeowner_id_rate_limits (email_hash, event_type, created_at desc);
create index homeowner_id_rate_limits_ip_idx on public.homeowner_id_rate_limits (ip_hash, event_type, created_at desc);
create index homeowner_id_rate_limits_cleanup_idx on public.homeowner_id_rate_limits (created_at);

create table public.homeowner_id_access_log (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.homeowner_applications(id) on delete cascade,
  manager_id uuid not null references auth.users(id) on delete restrict,
  accessed_at timestamptz not null default now()
);

create index homeowner_id_access_log_application_idx on public.homeowner_id_access_log (application_id, accessed_at desc);

alter table public.homeowner_id_upload_drafts enable row level security;
alter table public.homeowner_id_rate_limits enable row level security;
alter table public.homeowner_id_access_log enable row level security;

revoke all on table public.homeowner_id_upload_drafts from public, anon, authenticated;
revoke all on table public.homeowner_id_rate_limits from public, anon, authenticated;
revoke all on table public.homeowner_id_access_log from public, anon, authenticated;

create function private.set_homeowner_id_draft_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_homeowner_id_draft_updated_at() from public, anon, authenticated;

create trigger set_homeowner_id_draft_updated_at
before update on public.homeowner_id_upload_drafts
for each row execute function private.set_homeowner_id_draft_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homeowner-identification', 'homeowner-identification', false, 1572864, array['image/jpeg'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.homeowner_id_upload_drafts is
'Server-managed, short-lived upload authorizations. No browser Data API grants or Storage object policies exist.';
comment on table public.homeowner_id_access_log is
'Append-only audit trail for community-manager access to homeowner identification images.';
