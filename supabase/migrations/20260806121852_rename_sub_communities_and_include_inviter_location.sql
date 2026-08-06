alter type public.sub_community rename value 'Mirabella Villas' to 'Mirabella and Signature Villas';
alter type public.sub_community rename value 'Kingswood Homes' to 'Kingswood Park';

drop function public.verify_visitor_pass(text);

create function public.verify_visitor_pass(p_token_hash text)
returns table (
  status text,
  guest_name text,
  resident_name text,
  resident_sub_community public.sub_community,
  resident_unit_number text,
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
    return query select 'invalid'::text, null::text, null::text, null::public.sub_community, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  select
    visitor_passes.guest_name,
    visitor_passes.valid_from,
    visitor_passes.valid_until,
    visitor_passes.revoked_at,
    profiles.display_name,
    profiles.sub_community,
    profiles.unit_number,
    profiles.access_status
  into pass_record
  from public.visitor_passes
  join public.profiles on profiles.id = visitor_passes.resident_id
  where visitor_passes.token_hash = p_token_hash;

  if not found or pass_record.access_status <> 'active' then
    return query select 'invalid'::text, null::text, null::text, null::public.sub_community, null::text, null::timestamptz, null::timestamptz;
    return;
  end if;

  if pass_record.revoked_at is not null then
    show_details := pass_record.revoked_at > now() - interval '24 hours';
    return query select
      'revoked'::text,
      case when show_details then pass_record.guest_name else null end,
      case when show_details then coalesce(pass_record.display_name, 'Pearl Marina resident') else null end,
      case when show_details then pass_record.sub_community else null end,
      case when show_details then pass_record.unit_number else null end,
      case when show_details then pass_record.valid_from else null end,
      case when show_details then pass_record.valid_until else null end;
    return;
  end if;

  if now() < pass_record.valid_from then
    return query select
      'not_yet_valid'::text,
      pass_record.guest_name,
      coalesce(pass_record.display_name, 'Pearl Marina resident'),
      pass_record.sub_community,
      pass_record.unit_number,
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
      case when show_details then pass_record.sub_community else null end,
      case when show_details then pass_record.unit_number else null end,
      case when show_details then pass_record.valid_from else null end,
      case when show_details then pass_record.valid_until else null end;
    return;
  end if;

  return query select
    'valid'::text,
    pass_record.guest_name,
    coalesce(pass_record.display_name, 'Pearl Marina resident'),
    pass_record.sub_community,
    pass_record.unit_number,
    pass_record.valid_from,
    pass_record.valid_until;
end;
$$;

revoke all on function public.verify_visitor_pass(text) from public;
grant execute on function public.verify_visitor_pass(text) to anon, authenticated;
