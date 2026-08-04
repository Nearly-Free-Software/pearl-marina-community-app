import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, Home, MailWarning, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { Input } from "@/components/ui/input";
import { LinkStatus } from "@/components/ui/link-status";
import { PendingButton } from "@/components/ui/pending-button";
import { getAuthenticatedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatKampalaDateTime } from "@/lib/visitors";
import { redirect } from "next/navigation";
import { approveHomeownerApplication, rejectHomeownerApplication } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; rejected?: string; error?: string }>;
}) {
  const profile = await getAuthenticatedProfile();
  if (profile.role !== "community_manager") redirect("/dashboard");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("homeowner_applications")
    .select("*")
    .order("created_at", { ascending: false });
  const pending = applications?.filter((application) => application.status === "pending") ?? [];
  const reviewed = applications?.filter((application) => application.status !== "pending") ?? [];
  const error = params.error === "invitation_failed"
    ? "The account was approved, but its email could not be sent. Use Retry email below."
    : params.error === "id_verification_required"
      ? "Open the government ID and confirm that you compared its name before approval."
    : params.error
      ? "That action could not be completed. Please try again."
      : null;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" className="-ml-3 mb-5"><Link href="/dashboard"><ArrowLeft className="size-4" />Dashboard <LinkStatus label="Returning to dashboard" /></Link></Button>
        <div className="mb-8"><h1 className="text-3xl font-semibold tracking-tight">Homeowner applications</h1><p className="mt-2 text-muted-foreground">Verify ownership before registering an applicant.</p></div>
        {params.approved ? <p className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">Homeowner registered and sign-in email sent.</p> : null}
        {params.rejected ? <p className="mb-5 rounded-lg bg-secondary p-3 text-sm" role="status">Application rejected.</p> : null}
        {error ? <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}

        <section aria-labelledby="pending-heading">
          <div className="mb-4 flex items-center gap-2"><Clock3 className="size-5 text-primary" /><h2 id="pending-heading" className="text-xl font-semibold">Pending ({pending.length})</h2></div>
          <div className="grid gap-4">
            {pending.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No applications need review.</div> : pending.map((application) => (
              <Card key={application.id}>
                <CardHeader><CardTitle>{application.full_name}</CardTitle><CardDescription>Submitted {formatKampalaDateTime(application.created_at)}</CardDescription></CardHeader>
                <CardContent className="space-y-5">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt><dd className="mt-1 break-all">{application.email}</dd></div>
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</dt><dd className="mt-1">{application.phone}</dd></div>
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Community</dt><dd className="mt-1">{application.sub_community}</dd></div>
                    <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Unit</dt><dd className="mt-1">{application.unit_number}</dd></div>
                  </dl>
                  {application.id_required ? (
                    <div className="space-y-3 rounded-lg border bg-secondary/30 p-4">
                      <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><p className="font-medium">Government ID review</p></div>
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Applicant-confirmed name</dt><dd className="mt-1">{application.full_name}</dd></div>
                        <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">OCR suggestion</dt><dd className={`mt-1 ${application.id_ocr_suggested_name && application.id_ocr_suggested_name.toLocaleLowerCase() !== application.full_name.toLocaleLowerCase() ? "font-medium text-amber-800" : ""}`}>{application.id_ocr_suggested_name ?? (application.id_ocr_status === "failed" ? "OCR failed — inspect closely" : "No name found — inspect closely")}</dd></div>
                      </dl>
                      <Button asChild variant="outline" className="w-full sm:w-auto"><a href={`/api/dashboard/applications/${application.id}/government-id`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />View government ID (5 minutes)</a></Button>
                    </div>
                  ) : <p className="rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">Submitted before government ID verification was required.</p>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ConfirmForm action={approveHomeownerApplication.bind(null, application.id)} message={`Approve and register ${application.full_name}?`} className="space-y-3">{application.id_required ? <label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" name="id_compared" value="yes" className="mt-0.5 size-5 shrink-0 accent-primary" required /><span>I compared the applicant’s name with the ID.</span></label> : null}<PendingButton className="w-full" pendingLabel="Registering…"><CheckCircle2 className="size-4" />Approve and register</PendingButton></ConfirmForm>
                    <ConfirmForm action={rejectHomeownerApplication.bind(null, application.id)} message={`Reject ${application.full_name}'s application?`} className="space-y-2"><Input name="reason" maxLength={500} placeholder="Internal reason (optional)" aria-label="Internal rejection reason" /><PendingButton className="w-full" variant="outline" pendingLabel="Rejecting…"><XCircle className="size-4" />Reject</PendingButton></ConfirmForm>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {reviewed.length ? (
          <section className="mt-10" aria-labelledby="history-heading">
            <h2 id="history-heading" className="mb-4 text-xl font-semibold">Review history</h2>
            <div className="grid gap-3">{reviewed.map((application) => (
              <Card key={application.id}><CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{application.full_name}</p><p className="mt-1 text-sm text-muted-foreground">{application.sub_community} · Unit {application.unit_number}</p><p className="mt-1 text-xs text-muted-foreground">{application.status === "approved" ? "Approved" : application.status === "expired" ? "Expired" : "Rejected"} {application.reviewed_at ? formatKampalaDateTime(application.reviewed_at) : ""}</p>{application.id_required ? <p className="mt-1 text-xs text-muted-foreground">ID {application.id_deleted_at ? "deleted" : application.id_delete_after ? `available until ${formatKampalaDateTime(application.id_delete_after)}` : "retention pending"}</p> : null}</div>{application.status === "approved" && !application.invitation_sent_at ? <form action={approveHomeownerApplication.bind(null, application.id)}><PendingButton variant="outline" pendingLabel="Sending…"><MailWarning className="size-4" />Retry email</PendingButton></form> : <span className="inline-flex items-center gap-2 text-sm"><Home className="size-4 text-primary" />{application.status === "approved" ? "Registered" : "Not registered"}</span>}</CardContent></Card>
            ))}</div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
