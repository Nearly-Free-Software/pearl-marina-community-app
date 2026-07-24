import Link from "next/link";
import { ArrowLeft, Clock, RotateCcw, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatKampalaDateTime, passDisplayStatus } from "@/lib/visitors";
import { replaceVisitorPassToken, revokeVisitorPass } from "../actions";
import { QrPass } from "./qr-pass";

export const dynamic = "force-dynamic";

export default async function VisitorPassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; created?: string; revoked?: string; error?: string }>;
}) {
  await getAuthenticatedProfile();
  const { id } = await params;
  const query = await searchParams;
  const requestHeaders = await headers();
  const supabase = await createClient();
  const { data: pass } = await supabase.from("visitor_passes").select("*").eq("id", id).maybeSingle();
  if (!pass) notFound();

  const status = passDisplayStatus(pass);
  const canUseQr = !pass.revoked_at && new Date(pass.valid_until) > new Date();
  const replaceAction = replaceVisitorPassToken.bind(null, pass.id);
  const revokeAction = revokeVisitorPass.bind(null, pass.id);
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "app.pearlmarina.org";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const passUrl = query.token ? `${protocol}://${host}/visit/${encodeURIComponent(query.token)}` : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-6 sm:py-10">
      <Link href="/visitors" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" /> Guest passes
      </Link>
      {query.created ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Visitor pass created. Share it with your guest now.</p> : null}
      {query.revoked ? <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This visitor pass has been revoked.</p> : null}
      {query.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-900">The QR code could not be replaced. Please try again.</p> : null}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3"><div><CardTitle>{pass.guest_name}</CardTitle><CardDescription className="mt-1">Visitor pass</CardDescription></div><Badge className={status === "Active" ? "bg-primary text-primary-foreground" : ""}>{status}</Badge></div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 rounded-lg bg-secondary/60 p-4 text-sm">
            <p className="flex items-center gap-2"><UserRound className="size-4 text-primary" /> {pass.guest_phone}</p>
            <p className="flex items-start gap-2"><Clock className="mt-0.5 size-4 text-primary" /><span>{formatKampalaDateTime(pass.valid_from)}<br />to {formatKampalaDateTime(pass.valid_until)}</span></p>
          </div>
          {passUrl && canUseQr ? (
            <QrPass passUrl={passUrl} guestName={pass.guest_name} />
          ) : canUseQr ? (
            <div className="rounded-lg border border-dashed p-5 text-center">
              <p className="font-medium">Generate a replacement QR code</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">For security, the original QR token is not stored. Replacing it will immediately invalidate the previous code.</p>
              <form action={replaceAction} className="mt-4"><Button type="submit"><RotateCcw className="size-4" /> Replace QR code</Button></form>
            </div>
          ) : (
            <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">This pass no longer has an active QR code.</p>
          )}
          {canUseQr ? (
            <form action={revokeAction}><Button type="submit" variant="outline" className="w-full text-destructive">Revoke visitor pass</Button></form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
