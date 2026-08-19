alter table public.homeowner_applications
  alter column full_name drop not null,
  alter column email drop not null,
  alter column phone drop not null,
  alter column sub_community drop not null,
  alter column unit_number drop not null,
  add column anonymized_at timestamptz;

alter table public.homeowner_applications
  drop constraint homeowner_applications_reviewed_by_fkey,
  add constraint homeowner_applications_reviewed_by_fkey
    foreign key (reviewed_by) references auth.users(id) on delete set null,
  drop constraint homeowner_applications_id_verified_by_fkey,
  add constraint homeowner_applications_id_verified_by_fkey
    foreign key (id_verified_by) references auth.users(id) on delete set null,
  drop constraint homeowner_application_review_state_check,
  add constraint homeowner_application_review_state_check check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null and expired_at is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null and expired_at is null)
    or (status::text = 'expired' and expired_at is not null)
  ),
  drop constraint homeowner_application_verification_check,
  add constraint homeowner_application_verification_check check (
    id_verified_by is null or id_verified_at is not null
  );

alter table public.homeowner_id_access_log
  alter column manager_id drop not null,
  drop constraint homeowner_id_access_log_manager_id_fkey,
  add constraint homeowner_id_access_log_manager_id_fkey
    foreign key (manager_id) references auth.users(id) on delete set null;

create function private.anonymize_homeowner_application_for_deleted_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.homeowner_applications
  set
    full_name = null,
    email = null,
    phone = null,
    sub_community = null,
    unit_number = null,
    rejection_reason = null,
    auth_user_id = null,
    invitation_error = null,
    id_required = false,
    id_image_path = null,
    id_image_mime_type = null,
    id_image_size = null,
    id_ocr_status = null,
    id_ocr_suggested_name = null,
    name_confirmed_at = null,
    privacy_notice_version = null,
    privacy_accepted_at = null,
    id_verified_at = null,
    id_verified_by = null,
    id_delete_after = null,
    id_deleted_at = case when id_image_path is not null then coalesce(id_deleted_at, now()) else id_deleted_at end,
    anonymized_at = coalesce(anonymized_at, now())
  where auth_user_id = old.id
    and anonymized_at is null;

  return old;
end;
$$;

revoke all on function private.anonymize_homeowner_application_for_deleted_profile()
from public, anon, authenticated;

create trigger anonymize_homeowner_application_before_profile_delete
before delete on public.profiles
for each row execute function private.anonymize_homeowner_application_for_deleted_profile();

comment on column public.homeowner_applications.anonymized_at is
  'When set, direct applicant identifiers and identity-verification metadata have been permanently erased.';
