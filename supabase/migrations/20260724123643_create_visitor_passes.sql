create table public.visitor_passes (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.profiles(id) on delete cascade,
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 100),
  guest_phone text not null check (guest_phone ~ '^\+[1-9][0-9]{7,14}$'),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visitor_pass_valid_window check (
    valid_until > valid_from
    and valid_until <= valid_from + interval '31 days'
  )
);

create index visitor_passes_resident_created_idx
on public.visitor_passes (resident_id, created_at desc);

alter table public.visitor_passes enable row level security;

revoke all on table public.visitor_passes from anon, authenticated;
grant select, insert on table public.visitor_passes to authenticated;
grant update (token_hash, revoked_at) on table public.visitor_passes to authenticated;

create policy "Inviters can read their own visitor passes"
on public.visitor_passes for select
to authenticated
using (
  resident_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'homeowner', 'resident')
  )
);

create policy "Inviters can create their own visitor passes"
on public.visitor_passes for insert
to authenticated
with check (
  resident_id = (select auth.uid())
  and revoked_at is null
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'homeowner', 'resident')
  )
);

create policy "Inviters can revoke or replace their own visitor passes"
on public.visitor_passes for update
to authenticated
using (
  resident_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'homeowner', 'resident')
  )
)
with check (
  resident_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'homeowner', 'resident')
  )
);

create function private.set_visitor_pass_updated_at()
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

revoke all on function private.set_visitor_pass_updated_at() from public, anon, authenticated;

create trigger set_visitor_pass_updated_at
before update on public.visitor_passes
for each row execute function private.set_visitor_pass_updated_at();

create or replace function public.verify_visitor_pass(p_token_hash text)
returns table (
  status text,
  guest_name text,
  resident_name text,
  valid_from timestamptz,
  valid_until timestamptz
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  pass_record record;
  show_details boolean := false;
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    return query select 'invalid'::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select
    visitor_passes.guest_name,
    visitor_passes.valid_from,
    visitor_passes.valid_until,
    visitor_passes.revoked_at,
    profiles.display_name,
    profiles.access_status
  into pass_record
  from public.visitor_passes
  join public.profiles on profiles.id = visitor_passes.resident_id
  where visitor_passes.token_hash = p_token_hash;

  if not found or pass_record.access_status <> 'active' then
    return query select 'invalid'::text, null::text, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  if pass_record.revoked_at is not null then
    show_details := pass_record.revoked_at > now() - interval '24 hours';
    return query select
      'revoked'::text,
      case when show_details then pass_record.guest_name else null end,
      case when show_details then coalesce(pass_record.display_name, 'Pearl Marina resident') else null end,
      case when show_details then pass_record.valid_from else null end,
      case when show_details then pass_record.valid_until else null end;
    return;
  end if;

  if now() < pass_record.valid_from then
    return query select
      'not_yet_valid'::text,
      pass_record.guest_name,
      coalesce(pass_record.display_name, 'Pearl Marina resident'),
      pass_record.valid_from,
      pass_record.valid_until;
    return;
  end if;

  if now() > pass_record.valid_until then
    show_details := pass_record.valid_until > now() - interval '24 hours';
    return query select
      'expired'::text,
      case when show_details then pass_record.guest_name else null end,
      case when show_details then coalesce(pass_record.display_name, 'Pearl Marina resident') else null end,
      case when show_details then pass_record.valid_from else null end,
      case when show_details then pass_record.valid_until else null end;
    return;
  end if;

  return query select
    'valid'::text,
    pass_record.guest_name,
    coalesce(pass_record.display_name, 'Pearl Marina resident'),
    pass_record.valid_from,
    pass_record.valid_until;
end;
$$;

revoke all on function public.verify_visitor_pass(text) from public;
grant execute on function public.verify_visitor_pass(text) to anon, authenticated;

comment on table public.visitor_passes is
  'Time-limited guest access passes. Raw bearer tokens are never stored.';
comment on function public.verify_visitor_pass(text) is
  'Minimal public visitor-pass verification API. Accepts a SHA-256 token hash.';
