create table public.visitor_pass_tokens (
  visitor_pass_id uuid primary key references public.visitor_passes(id) on delete cascade,
  encrypted_token text not null,
  created_at timestamptz not null default now()
);

alter table public.visitor_pass_tokens enable row level security;
revoke all on table public.visitor_pass_tokens from anon, authenticated;
grant all on table public.visitor_pass_tokens to service_role;

comment on table public.visitor_pass_tokens is
  'Server-only encrypted bearer tokens. Browser roles have no access; the application decrypts tokens only to render a resident link.';
