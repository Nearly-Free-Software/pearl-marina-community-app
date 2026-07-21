create type public.community_role as enum ('admin', 'homeowner', 'resident', 'service_provider');
create type public.access_status as enum ('active', 'disabled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 100),
  email text not null,
  role public.community_role not null default 'resident',
  access_status public.access_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create policy "Active users can read their own profile"
on public.profiles for select
to authenticated
using (
  (select auth.uid()) = id
  and access_status = 'active'
);

create policy "Active users can update their display name"
on public.profiles for update
to authenticated
using (
  (select auth.uid()) = id
  and access_status = 'active'
)
with check (
  (select auth.uid()) = id
  and access_status = 'active'
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    new.email
  );
  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;

create trigger create_profile_after_auth_user
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

create function private.set_profile_updated_at()
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

revoke all on function private.set_profile_updated_at() from public, anon, authenticated;

create trigger set_profile_updated_at
before update on public.profiles
for each row execute function private.set_profile_updated_at();

comment on table public.profiles is 'Community identity and authorization attributes linked to Supabase Auth.';
