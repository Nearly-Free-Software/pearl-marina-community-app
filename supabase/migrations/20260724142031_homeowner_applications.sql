alter type public.community_role add value if not exists 'community_manager' after 'admin';

create type public.sub_community as enum (
  'Bella Vista Apartments',
  'Mirabella Villas',
  'La Perla Bungalows',
  'Riviera Townhouses',
  'Kingswood Homes'
);
create type public.homeowner_application_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  add column sub_community public.sub_community,
  add column unit_number text check (unit_number is null or char_length(trim(unit_number)) between 1 and 32);

create table public.homeowner_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  email text not null check (email = lower(trim(email)) and char_length(email) <= 254),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  sub_community public.sub_community not null,
  unit_number text not null check (char_length(trim(unit_number)) between 1 and 32),
  status public.homeowner_application_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  auth_user_id uuid references auth.users(id) on delete set null,
  invitation_sent_at timestamptz,
  invitation_error text check (invitation_error is null or char_length(invitation_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  )
);

create unique index homeowner_applications_open_email_key
on public.homeowner_applications (email)
where status in ('pending', 'approved');

create index homeowner_applications_review_queue_idx
on public.homeowner_applications (status, created_at desc);

alter table public.homeowner_applications enable row level security;
revoke all on table public.homeowner_applications from anon, authenticated;
grant select on table public.homeowner_applications to authenticated;

create policy "Active community managers can read homeowner applications"
on public.homeowner_applications for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role::text = 'community_manager'
      and profiles.access_status = 'active'
  )
);

create function private.set_homeowner_application_updated_at()
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

revoke all on function private.set_homeowner_application_updated_at() from public, anon, authenticated;

create trigger set_homeowner_application_updated_at
before update on public.homeowner_applications
for each row execute function private.set_homeowner_application_updated_at();

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved_application public.homeowner_applications%rowtype;
begin
  select *
  into approved_application
  from public.homeowner_applications
  where email = lower(new.email)
    and status = 'approved'
  order by reviewed_at desc
  limit 1;

  if found then
    insert into public.profiles (
      id, display_name, email, phone, sub_community, unit_number, role, access_status
    )
    values (
      new.id,
      approved_application.full_name,
      lower(new.email),
      approved_application.phone,
      approved_application.sub_community,
      approved_application.unit_number,
      'homeowner',
      'active'
    );

    update public.homeowner_applications
    set auth_user_id = new.id
    where id = approved_application.id;
  else
    insert into public.profiles (id, display_name, email)
    values (
      new.id,
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
      lower(new.email)
    );
  end if;

  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;

comment on table public.homeowner_applications is
'Homeowner access applications. Browser clients may only read these through manager-scoped RLS.';
