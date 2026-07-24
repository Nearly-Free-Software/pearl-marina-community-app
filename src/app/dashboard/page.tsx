import Link from "next/link";
import { CalendarDays, ClipboardCheck, Home, LogOut, QrCode, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkStatus } from "@/components/ui/link-status";
import { PendingButton } from "@/components/ui/pending-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedProfile, roleLabels } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { canInviteGuests } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getAuthenticatedProfile();
  return (
    <main className="min-h-screen">
      <header className="border-b bg-card"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">PM</span><span className="font-semibold tracking-tight">Pearl Marina</span></div><form action={signOut}><PendingButton pendingLabel="Signing out…" iconOnly variant="ghost" size="icon" aria-label="Sign out"><LogOut className="size-5" /></PendingButton></form></div></header>
      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8"><Badge>{roleLabels[profile.role]}</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight">Welcome{profile.display_name ? `, ${profile.display_name}` : ""}</h1><p className="mt-2 text-muted-foreground">Your community space is ready. More services will appear here as they become available.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-full bg-secondary"><Home className="size-5" /></div><CardTitle>Your account</CardTitle><CardDescription>Community access and contact information.</CardDescription></CardHeader><CardContent className="space-y-4"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p><p className="mt-1 break-all text-sm">{profile.email}</p></div>{profile.phone ? <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</p><p className="mt-1 text-sm">{profile.phone}</p></div> : null}{profile.sub_community ? <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Home</p><p className="mt-1 text-sm">{profile.sub_community}{profile.unit_number ? ` · Unit ${profile.unit_number}` : ""}</p></div> : null}<div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Access</p><p className="mt-1 flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-primary" />Active</p></div></CardContent></Card>
          {canInviteGuests(profile.role) ? (
            <Card><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-full bg-secondary"><QrCode className="size-5" /></div><CardTitle>Guest access</CardTitle><CardDescription>Create a time-limited QR pass for a visitor.</CardDescription></CardHeader><CardContent className="grid gap-3"><Button asChild><Link href="/visitors/new">Invite a guest <LinkStatus label="Opening guest form" /></Link></Button><Button asChild variant="outline"><Link href="/visitors">Manage guest passes <LinkStatus label="Opening guest passes" /></Link></Button></CardContent></Card>
          ) : (
            <Card><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-full bg-secondary"><CalendarDays className="size-5" /></div><CardTitle>Community services</CardTitle><CardDescription>Notices, requests, events, and other services will be added here next.</CardDescription></CardHeader><CardContent><div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Nothing needs your attention right now.</div></CardContent></Card>
          )}
          {profile.role === "community_manager" ? (
            <Card><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-full bg-secondary"><ClipboardCheck className="size-5" /></div><CardTitle>Homeowner applications</CardTitle><CardDescription>Review and activate homeowner access requests.</CardDescription></CardHeader><CardContent><Button asChild className="w-full"><Link href="/dashboard/applications">Review applications <LinkStatus label="Opening applications" /></Link></Button></CardContent></Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
