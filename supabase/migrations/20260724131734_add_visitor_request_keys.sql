alter table public.visitor_passes
add column request_key uuid;

update public.visitor_passes
set request_key = gen_random_uuid()
where request_key is null;

alter table public.visitor_passes
alter column request_key set not null;

alter table public.visitor_passes
add constraint visitor_passes_resident_request_key_unique
unique (resident_id, request_key);

comment on column public.visitor_passes.request_key is
  'Client submission key used to prevent duplicate passes from retries or repeated taps.';
