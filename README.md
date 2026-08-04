# Pearl Marina Community App

Mobile-first community portal for Pearl Marina homeowners, residents, community managers, and service providers.

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

The app deliberately refuses to start authenticated routes when required Supabase variables are missing. `SUPABASE_SECRET_KEY` is required for homeowner applications and manager approval. `SUPABASE_SERVICE_ROLE_KEY` is additionally required for server-side Storage operations used by homeowner ID verification. Never place either credential in a `NEXT_PUBLIC_` variable.

## Authentication

Unrestricted Supabase Auth sign-up is disabled. Homeowners apply at `/signup`; submitting the form creates a pending application but no Auth account. A community manager verifies ownership and approves the application, which automatically registers the homeowner and sends their first passwordless sign-in email.

Administrators may continue inviting residents and service providers from **Supabase Dashboard → Authentication → Users → Invite user**. Existing and approved users request magic sign-in links at `/login`.

For hosted projects, configure:

- Site URL: `https://app.pearlmarina.org`
- Redirect URL: `https://app.pearlmarina.org/auth/confirm`
- Staged deployment redirect URL: `https://*-pearl-marina.vercel.app/**`
- Magic-link template destination: `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink`
- Invitation template destination: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`
- A custom SMTP provider before the wider community pilot
- `SUPABASE_SECRET_KEY` as a server-only Vercel variable for application submission and automatic registration
- `SUPABASE_SERVICE_ROLE_KEY` as a server-only, sensitive Vercel variable for Supabase Storage administration

Keep **Allow new users to sign up** disabled in both general Auth and Email provider settings. Invitations through the administrator API/dashboard remain the account-creation path.

### Assign a role

New manually invited profiles default to `resident`. Approved homeowner applications are assigned automatically. After manually inviting another user, an authorized database administrator assigns the approved role in the Supabase SQL editor:

```sql
update public.profiles
set role = 'homeowner' -- admin | community_manager | homeowner | resident | service_provider
where email = 'person@example.com';
```

To establish the first administrator, use the same statement with `role = 'admin'`. To suspend access without deleting history:

```sql
update public.profiles
set access_status = 'disabled'
where email = 'person@example.com';
```

These operations require a trusted dashboard/database administrator and are intentionally unavailable to browser clients.

### Establish a community manager

After the person already has an invited account, a trusted database administrator assigns the role:

```sql
update public.profiles
set role = 'community_manager'
where email = 'manager@example.com';
```

An active community manager can open **Homeowner applications** from the dashboard. They verify ownership outside the app, then choose **Approve and register** or **Reject**. Approval creates or reuses exactly one Auth account, writes the approved property details to the homeowner profile, and sends a first sign-in email. If email delivery fails, the approved record remains available with a **Retry email** action.

Rejected applicants may submit a corrected application later. Rejection reasons are internal and visible only in the protected review data.

### Government ID verification (gated rollout)

The optional homeowner ID workflow is controlled by the server-only `HOMEOWNER_ID_REQUIREMENT_ENABLED` variable. Keep it `false` until the privacy/legal review, PDPO processing-registration update, Google Cloud setup, and staged end-to-end test are complete. Existing applications remain grandfathered and never become ID-required.

When enabled, an applicant uploads one JPEG, PNG, or WebP photo. The browser rotates it, resizes the longest edge to at most 2,000 pixels, re-encodes it as JPEG (which removes the original metadata), and limits it to 1.5 MB. It uploads directly to the private `homeowner-identification` bucket using a path-specific signed token. Google Vision Text Detection runs synchronously and only the resulting status and suggested name are stored; raw OCR text and ID numbers are not retained.

Required server-only variables:

- `GOOGLE_CLOUD_VISION_API_KEY`: a dedicated credential restricted to the Cloud Vision API.
- `SIGNUP_RATE_LIMIT_SECRET`: at least 32 random bytes, used to HMAC IP and email rate-limit identifiers.
- `CRON_SECRET`: a random bearer secret Vercel supplies to the daily cleanup request.

Create the two application secrets with a cryptographically secure generator such as `openssl rand -base64 48`. Never put these values in a `NEXT_PUBLIC_` variable. Enable Cloud Vision in a dedicated Google Cloud project, restrict the API key to `vision.googleapis.com`, set a conservative daily quota and billing-budget alerts, and rotate the key immediately if it may have been exposed.

Only active community managers can open the on-demand five-minute ID link. Each access is recorded in `homeowner_id_access_log`. Managers must inspect the image and check **I compared the applicant’s name with the ID** before approval. Audit access in the Supabase SQL editor with a restricted, trusted database account; do not export applicant data unnecessarily:

```sql
select application_id, manager_id, accessed_at
from public.homeowner_id_access_log
order by accessed_at desc;
```

The Vercel cron calls `/api/cron/homeowner-id-retention` daily. It deletes decided IDs after 30 days, expires pending ID-backed applications and deletes their IDs after 60 days, removes abandoned drafts after 24 hours, and removes rate-limit rows after seven days. An object is marked deleted only after Storage confirms removal; failures are retried next day. To run it manually, use an HTTPS request with `Authorization: Bearer <CRON_SECRET>` and inspect only the aggregate response counts.

For an incident, first set `HOMEOWNER_ID_REQUIREMENT_ENABLED=false` and redeploy, rotate the affected Google/Vercel/Supabase credentials, review manager access events and deployment logs without copying signed URLs or personal data, notify the community privacy lead, and follow the legally reviewed breach-response process. Do not log images, signed URLs, OCR text, applicant names, or object paths while investigating.

## Guest passes

Residents, homeowners, and administrators can open **Guest access** from the dashboard, enter a visitor's name and international phone number, and choose access for today, 24 hours, or a custom period. The resulting QR code can be shared through the device share sheet, copied as a link, or downloaded.

Security personnel do not need an account. Any phone camera or QR scanner can open the public `/visit/<token>` page and see the live pass status, guest name, inviting resident, and validity period.

Privacy and security properties:

- The QR contains a 256-bit random bearer token rather than personal information.
- Only the SHA-256 token hash is stored in Postgres.
- Guest phone numbers are visible only to the inviting resident through authenticated, owner-scoped access.
- Unknown codes reveal no personal information.
- Expired and revoked passes stop revealing names after 24 hours.
- Verification pages opt out of indexing, previews, caching, and referrer sharing.
- Replacing a QR immediately invalidates the previous code; revocation is checked live.

Anyone possessing a valid QR can view its limited verification details. Treat it like a temporary access pass and revoke it if it is shared with the wrong person.

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
3. Add the hosted Supabase URL, publishable key, server-only secret key, and production site URL to the Vercel **Production** environment.
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

For guest access, verify pass creation, native sharing or copy fallback, scanning on a second phone, immediate revocation, expiry behavior, and that invalid codes reveal no names or phone numbers.

## Troubleshooting

- **Missing Supabase environment variables:** populate both required public variables in `.env.local` or the matching Vercel environment.
- **Magic link returns to the wrong host:** correct Supabase Site URL, redirect allow-list, and the email template.
- **User can authenticate but cannot reach the dashboard:** confirm a profile was created and `access_status` is `active`.
- **Profile update affects zero rows:** RLS requires the user to have an active readable profile; role and status are intentionally not browser-updatable.
- **Email never arrives:** Supabase's development mail service is rate-limited. Check Auth logs and configure custom SMTP for real users.
- **Homeowner application fails immediately:** confirm `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are configured server-side and neither is prefixed with `NEXT_PUBLIC_`.
- **Approved homeowner email fails:** check Supabase Auth/SMTP logs, then use **Retry email** in the manager review history.
- **ID upload is unavailable:** confirm the feature flag and all three ID-workflow secrets are configured. Leave the flag off if the Google key or privacy approval is missing.
- **OCR cannot suggest a name:** applicants can enter it manually; the manager queue highlights the failure for closer inspection.
- **Retention reports failures:** rerun the authenticated cleanup route, inspect Supabase Storage health, and confirm deletion before making any manual database update.
- **Vercel build differs from local:** verify the hosted values exist in the Production environment and that the staged build came from the expected `main` commit.

This repository intentionally has no license until the community chooses one.
