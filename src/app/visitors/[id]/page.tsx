import Link from "next/link";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { Badge } from "@/components/ui/badge";
import { PendingButton } from "@/components/ui/pending-button";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkStatus } from "@/components/ui/link-status";
import { getAuthenticatedProfile } from "@/lib/auth";
import { decryptPassToken } from "@/lib/visitors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatKampalaDateTime, passDisplayStatus } from "@/lib/visitors";
import { revokeVisitorPass } from "../actions";
import { PassLink } from "./pass-link";

export const dynamic = "force-dynamic";

export default async function VisitorPassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; created?: string; revoked?: string }>;
}) {
  const profile = await getAuthenticatedProfile();
  const { id } = await params;
  const query = await searchParams;
  const requestHeaders = await headers();
  const supabase = await createClient();
  const { data: pass } = await supabase.from("visitor_passes").select("*").eq("id", id).maybeSingle();
  if (!pass) notFound();

  const status = passDisplayStatus(pass);
  const canRevoke = !pass.revoked_at && new Date(pass.valid_until) > new Date();
  const { data: encryptedToken } = pass.resident_id === profile.id
    ? await createAdminClient().from("visitor_pass_tokens").select("encrypted_token").eq("visitor_pass_id", pass.id).maybeSingle()
    : { data: null };
  const revokeAction = revokeVisitorPass.bind(null, pass.id);
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "app.pearlmarina.org";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  let token = query.token ?? null;
  if (!token && encryptedToken?.encrypted_token) {
    try { token = decryptPassToken(encryptedToken.encrypted_token); } catch { token = null; }
  }
  const passUrl = token ? `${protocol}://${host}/visit/${encodeURIComponent(token)}` : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-6 sm:py-10">
      <Link href="/visitors" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" /> Guest passes <LinkStatus label="Returning to guest passes" />
      </Link>
      {query.created ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Visitor pass created. Share it with your guest now.</p> : null}
      {query.revoked ? <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This visitor pass has been revoked.</p> : null}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3"><div><CardTitle>{pass.guest_name}</CardTitle><CardDescription className="mt-1">Visitor pass</CardDescription></div><Badge className={status === "Active" ? "bg-primary text-primary-foreground" : ""}>{status}</Badge></div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 rounded-lg bg-secondary/60 p-4 text-sm">
            <p className="flex items-center gap-2"><UserRound className="size-4 text-primary" /> {pass.guest_phone}</p>
            <p className="flex items-start gap-2"><Clock className="mt-0.5 size-4 text-primary" /><span>{formatKampalaDateTime(pass.valid_from)}<br />to {formatKampalaDateTime(pass.valid_until)}</span></p>
          </div>
          {passUrl ? <PassLink passUrl={passUrl} guestName={pass.guest_name} /> : <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">The visitor pass link is unavailable for this older pass.</p>}
          {canRevoke ? (
            <ConfirmForm action={revokeAction} message={`Revoke ${pass.guest_name}'s visitor pass? The shared link will stop working immediately.`}>
              <PendingButton pendingLabel="Revoking pass…" variant="outline" className="w-full text-destructive">Revoke visitor pass</PendingButton>
            </ConfirmForm>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
