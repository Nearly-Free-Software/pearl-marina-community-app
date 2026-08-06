import type { Metadata } from "next";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatKampalaDateTime, hashPassToken, verificationCopy } from "@/lib/visitors";
import type { VisitorPassVerification } from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Verify visitor pass",
  description: "Verify a Pearl Marina visitor pass.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default async function VerifyVisitorPassPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const tokenHash = hashPassToken(token);
  const { data, error } = await supabase.rpc("verify_visitor_pass", { p_token_hash: tokenHash });
  const verification: VisitorPassVerification =
    !error && data?.[0]
      ? data[0]
      : { status: "invalid", guest_name: null, resident_name: null, resident_sub_community: null, resident_unit_number: null, valid_from: null, valid_until: null };
  const copy = verificationCopy[verification.status] ?? verificationCopy.invalid;
  const tone = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-950",
    warning: "border-amber-300 bg-amber-50 text-amber-950",
    danger: "border-red-300 bg-red-50 text-red-950",
  }[copy.tone];
  const Icon = copy.tone === "success" ? CheckCircle2 : ShieldAlert;

  return (
    <main className="flex min-h-screen w-full min-w-0 items-center justify-center overflow-x-hidden px-5 py-8">
      <div className="w-[calc(100vw-2.5rem)] min-w-0 max-w-md">
        <div className="mb-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">PM</span><p className="mt-3 text-sm font-medium">Pearl Marina visitor access</p></div>
        <Card className={`w-full min-w-0 max-w-full overflow-hidden border-2 ${tone}`}>
          <CardContent className="p-6 sm:p-8">
            <Icon className="size-12" aria-hidden="true" />
            <p className="mt-5 text-sm font-bold uppercase tracking-widest">{copy.label}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{copy.heading}</h1>
            <p className="mt-2 break-words text-sm leading-6 opacity-80">{copy.description}</p>
            {verification.guest_name && verification.resident_name ? (
              <dl className="mt-7 space-y-4 border-t border-current/20 pt-6">
                <div><dt className="text-xs font-semibold uppercase tracking-wide opacity-70">Guest</dt><dd className="mt-1 text-lg font-semibold">{verification.guest_name}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wide opacity-70">Invited by</dt><dd className="mt-1 font-medium">{verification.resident_name}{verification.resident_sub_community || verification.resident_unit_number ? <strong className="font-bold"> ({[verification.resident_sub_community, verification.resident_unit_number].filter(Boolean).join(" ")})</strong> : null}</dd></div>
                {verification.valid_from && verification.valid_until ? (
                  <div><dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide opacity-70"><Clock3 className="size-3" /> Access period</dt><dd className="mt-1 text-sm leading-6">{formatKampalaDateTime(verification.valid_from)}<br />to {formatKampalaDateTime(verification.valid_until)}</dd></div>
                ) : null}
              </dl>
            ) : null}
          </CardContent>
        </Card>
        <p className="mt-5 break-words px-2 text-center text-xs leading-5 text-muted-foreground">Checked live at {formatKampalaDateTime(new Date())}. Refresh this page to check again.</p>
      </div>
    </main>
  );
}
