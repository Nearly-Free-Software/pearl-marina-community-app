import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedProfile } from "@/lib/auth";
import { canInviteGuests } from "@/lib/visitors";
import { VisitorForm } from "./visitor-form";

export const dynamic = "force-dynamic";

export default async function NewVisitorPage() {
  const profile = await getAuthenticatedProfile();
  if (!canInviteGuests(profile.role)) {
    return <main className="mx-auto max-w-xl px-5 py-10">Your account cannot create visitor passes.</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-6 sm:py-10">
      <Link href="/visitors" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" /> Back to guest passes
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Invite a guest</CardTitle>
          <CardDescription>Create a time-limited QR pass to share with your visitor.</CardDescription>
        </CardHeader>
        <CardContent><VisitorForm /></CardContent>
      </Card>
    </main>
  );
}
