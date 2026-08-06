import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HOMEOWNER_ID_PRIVACY_VERSION } from "@/lib/homeowner-identification";

export default function HomeownerIdPrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader><CardTitle>Homeowner ID privacy notice</CardTitle><CardDescription>Version {HOMEOWNER_ID_PRIVACY_VERSION}</CardDescription></CardHeader>
        <CardContent className="space-y-5 text-sm leading-7 text-muted-foreground">
          <p>Pearl Marina HOA collects one image of a government-issued photo ID to help a community manager compare the applicant’s confirmed name and photograph while reviewing a homeowner application.</p>
          <p>The image is kept securely and used only for this review. A computer-assisted name suggestion may help pre-fill the applicant’s name, but it does not make the approval decision. We do not keep a full reading of the document or intentionally extract or store ID numbers.</p>
          <p>Only active community managers may request a five-minute viewing link. Each request is recorded in an access audit. Other residents, homeowners, service providers, administrators, and public visitors cannot view the image through the app.</p>
          <p>If the application is approved or rejected, the image is deleted immediately after the decision is recorded. If an application remains undecided, or an upload is abandoned, the image is deleted within 24 hours. Necessary records showing that a review and deletion took place may remain.</p>
          <p>Do not submit an ID unless you accept this processing. For a privacy request or incident report, contact the Pearl Marina HOA community management team through the community’s established contact channel.</p>
          <Link href="/signup" className="inline-block font-medium text-primary underline">Return to application</Link>
        </CardContent>
      </Card>
    </main>
  );
}
