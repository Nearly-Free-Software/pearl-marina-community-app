alter policy "Inviters can read their own visitor passes"
on public.visitor_passes
using (
  resident_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'community_manager', 'homeowner', 'resident')
  )
);

alter policy "Inviters can create their own visitor passes"
on public.visitor_passes
with check (
  resident_id = (select auth.uid())
  and revoked_at is null
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'community_manager', 'homeowner', 'resident')
  )
);

alter policy "Inviters can revoke or replace their own visitor passes"
on public.visitor_passes
using (
  resident_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'community_manager', 'homeowner', 'resident')
  )
)
with check (
  resident_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.access_status = 'active'
      and profiles.role in ('admin', 'community_manager', 'homeowner', 'resident')
  )
);

comment on policy "Inviters can create their own visitor passes" on public.visitor_passes is
  'Active admins, community managers, homeowners, and residents may create passes they own.';
