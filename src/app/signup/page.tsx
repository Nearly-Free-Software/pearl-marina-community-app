import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";
import { subCommunities } from "@/lib/homeowner-applications";
import { submitHomeownerApplication } from "./actions";
import { FieldRequirement, FormRequirementLegend } from "./field-requirement";
import { IdSignupForm } from "./id-signup-form";
import { isIdRequirementEnabled } from "@/lib/homeowner-identification";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const params = await searchParams;
  const error = params.error === "submission_failed"
    ? "We could not submit your application. Please try again."
    : params.error;
  const idRequired = isIdRequirementEnabled();
  const supabase = idRequired ? getSupabaseEnv() : null;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid size-11 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">PM</span>
          <span><span className="block font-semibold">Pearl Marina</span><span className="block text-xs text-muted-foreground">Community portal</span></span>
        </Link>
        <Card>
          <CardHeader>
            <div className="mb-3 grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground"><Home className="size-5" /></div>
            <CardTitle>Apply for homeowner access</CardTitle>
            <CardDescription>Your community manager will verify your details before activating your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {params.submitted ? (
              <div className="space-y-5">
                <div className="rounded-lg border bg-secondary/60 p-4" role="status">
                  <CheckCircle2 className="mb-3 size-6 text-primary" />
                  <p className="font-medium">Application received</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">If these details are eligible, a community manager will approve your account and you will receive a secure sign-in email.</p>
                </div>
                <Link href="/login" className="block text-center text-sm font-medium text-primary underline-offset-4 hover:underline">Return to sign in</Link>
              </div>
            ) : idRequired && supabase ? <IdSignupForm error={error} supabase={supabase} /> : (
              <form action={submitHomeownerApplication} className="space-y-4">
                <FormRequirementLegend />
                <div className="space-y-2"><label htmlFor="full_name" className="text-sm font-medium">Full name<FieldRequirement kind="required" /></label><Input id="full_name" name="full_name" autoComplete="name" maxLength={100} required /></div>
                <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">Email address<FieldRequirement kind="required" /></label><Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required /></div>
                <div className="space-y-2"><label htmlFor="phone" className="text-sm font-medium">Phone number<FieldRequirement kind="required" /></label><Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+256…" required /><p className="text-xs text-muted-foreground">Include the country code.</p></div>
                <div className="space-y-2">
                  <label htmlFor="sub_community" className="text-sm font-medium">Community<FieldRequirement kind="required" /></label>
                  <select id="sub_community" name="sub_community" className="flex h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" defaultValue="" required>
                    <option value="" disabled>Select your community</option>
                    {subCommunities.map((community) => <option key={community} value={community}>{community}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><label htmlFor="unit_number" className="text-sm font-medium">Unit number<FieldRequirement kind="required" /></label><Input id="unit_number" name="unit_number" autoComplete="off" maxLength={32} required /></div>
                {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
                <PendingButton className="w-full" pendingLabel="Submitting application…">Submit application</PendingButton>
                <p className="text-center text-sm text-muted-foreground">Already approved? <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link></p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
