# Pearl Marina Community App

Mobile-first, invitation-only community portal for Pearl Marina homeowners, residents, and service providers.

## Stack

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS
- Supabase Auth and Postgres with Row Level Security
- Vercel hosting and Web Analytics
- Vitest and Playwright

## Local setup

Requirements: Node.js 24+, npm, Docker Desktop, and the Supabase CLI.

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and keep the file private.
3. Start local Supabase with `npm run db:start`.
4. Copy the local API URL and publishable/anon key reported by `supabase status` into `.env.local`.
5. Apply migrations with `npm run db:reset`.
6. Start Next.js with `npm run dev`.

The app deliberately refuses to start authenticated routes when required Supabase variables are missing. Never place a secret or `service_role` key in a `NEXT_PUBLIC_` variable.

## Authentication

Public sign-up is disabled. An administrator invites approved users from **Supabase Dashboard → Authentication → Users → Invite user**. Existing invited users may request a magic sign-in link at `/login`.

For hosted projects, configure:

- Site URL: `https://app.pearlmarina.org`
- Redirect URL: `https://app.pearlmarina.org/auth/confirm`
- Staged deployment redirect URL: `https://*-pearl-marina.vercel.app/**`
- Magic-link template destination: `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink`
- Invitation template destination: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`
- A custom SMTP provider before the wider community pilot

Keep **Allow new users to sign up** disabled in both general Auth and Email provider settings. Invitations through the administrator API/dashboard remain the account-creation path.

### Assign a role

New profiles default to `resident`. After inviting a user, an authorized database administrator assigns the approved role in the Supabase SQL editor:

```sql
update public.profiles
set role = 'homeowner' -- admin | homeowner | resident | service_provider
where email = 'person@example.com';
```

To establish the first administrator, use the same statement with `role = 'admin'`. To suspend access without deleting history:

```sql
update public.profiles
set access_status = 'disabled'
where email = 'person@example.com';
```

These operations require a trusted dashboard/database administrator and are intentionally unavailable to browser clients.

## Supabase environments and migrations

Use local Supabase during development and one hosted Supabase project for staged and live production deployments. Link deliberately and verify the production project reference before pushing migrations:

```bash
supabase login
supabase link --project-ref <production-project-ref>
supabase migration list
supabase db push --dry-run
supabase db push
supabase gen types typescript --linked > src/types/database.generated.ts
```

Schema changes begin with `supabase migration new <description>` and are verified with local Supabase before being pushed to the hosted project. Do not edit production schema manually except for the documented temporary role-management procedure.

## Vercel deployment

1. Install and authenticate the CLI: `npm install --global vercel` and `vercel login`.
2. Import `Nearly-Free-Software/pearl-marina-community-app` in Vercel or run `vercel link`.
3. Add the hosted Supabase URL, publishable key, and production site URL to the Vercel **Production** environment.
4. Set `main` as the Production Branch.
5. Under **Settings → Environments → Production → Branch Tracking**, disable **Auto-assign Custom Production Domains**.
6. Add `app.pearlmarina.org` and create only the DNS record Vercel requests. Do not change the apex or `www` records serving WordPress.

This project uses staged production deployments rather than a persistent preview environment:

1. Work locally against local Supabase.
2. Run `npm run release:check`.
3. Push the tested commit to `main`.
4. Vercel creates a production-target build at a temporary `.vercel.app` URL without changing the live custom domain.
5. Verify that exact staged deployment on desktop and mobile.
6. Promote the staged deployment manually. Promotion assigns the custom domain without rebuilding.

Both staged and promoted builds use the same Production environment variables and hosted Supabase project.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run release:check
npm run test:e2e
```

With local Supabase running, also run `npm run db:test` and manually verify an invited-user login, expired-link handling, session refresh, sign-out, and disabled-user rejection.

## Troubleshooting

- **Missing Supabase environment variables:** populate both required public variables in `.env.local` or the matching Vercel environment.
- **Magic link returns to the wrong host:** correct Supabase Site URL, redirect allow-list, and the email template.
- **User can authenticate but cannot reach the dashboard:** confirm a profile was created and `access_status` is `active`.
- **Profile update affects zero rows:** RLS requires the user to have an active readable profile; role and status are intentionally not browser-updatable.
- **Email never arrives:** Supabase's development mail service is rate-limited. Check Auth logs and configure custom SMTP for real users.
- **Vercel build differs from local:** verify the hosted values exist in the Production environment and that the staged build came from the expected `main` commit.

This repository intentionally has no license until the community chooses one.
