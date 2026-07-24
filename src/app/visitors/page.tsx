import Link from "next/link";
import { ArrowLeft, Plus, QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthenticatedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canInviteGuests, formatKampalaDateTime, passDisplayStatus } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export default async function VisitorsPage() {
  const profile = await getAuthenticatedProfile();
  if (!canInviteGuests(profile.role)) {
    return <main className="mx-auto max-w-xl px-5 py-10">Your account cannot create visitor passes.</main>;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("visitor_passes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  const passes = data ?? [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-6 sm:py-10">
      <Link href="/dashboard" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">Guest passes</h1><p className="mt-2 text-sm text-muted-foreground">Create and manage access for your visitors.</p></div>
        <Button asChild><Link href="/visitors/new"><Plus className="size-4" /> Invite</Link></Button>
      </div>
      {passes.length ? (
        <div className="space-y-3">
          {passes.map((pass) => {
            const status = passDisplayStatus(pass);
            return (
              <Link key={pass.id} href={`/visitors/${pass.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="transition-colors hover:bg-secondary/40">
                  <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary"><QrCode className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{pass.guest_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Until {formatKampalaDateTime(pass.valid_until)}</p>
                    </div>
                    <Badge className={status === "Active" ? "bg-primary text-primary-foreground" : ""}>{status}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card><CardContent className="py-12 text-center"><QrCode className="mx-auto size-9 text-muted-foreground" /><p className="mt-4 font-medium">No guest passes yet</p><p className="mt-1 text-sm text-muted-foreground">Invite your first guest when you are ready.</p></CardContent></Card>
      )}
    </main>
  );
}
