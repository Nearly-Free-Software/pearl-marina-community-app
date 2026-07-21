import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requestMagicLink } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  const error = params.error === "invalid_email" ? "Enter a valid email address." : authErrorMessage(params.error);

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="grid size-11 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">PM</span>
          <span><span className="block font-semibold">Pearl Marina</span><span className="block text-xs text-muted-foreground">Community portal</span></span>
        </Link>
        <Card>
          <CardHeader>
            <div className="mb-3 grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground"><KeyRound className="size-5" /></div>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Use the email address invited by your community administrator. We will send you a secure sign-in link.</CardDescription>
          </CardHeader>
          <CardContent>
            {params.sent ? (
              <div className="rounded-lg border bg-secondary/60 p-4" role="status"><CheckCircle2 className="mb-3 size-6 text-primary" /><p className="font-medium">Check your email</p><p className="mt-1 text-sm leading-6 text-muted-foreground">If this address has community access, a sign-in link is on its way.</p></div>
            ) : (
              <form action={requestMagicLink} className="space-y-4">
                <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">Email address</label><Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required /></div>
                {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
                <Button className="w-full" type="submit">Email me a sign-in link</Button>
              </form>
            )}
            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Access is invitation-only. Contact the community administrator if you need an account.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
