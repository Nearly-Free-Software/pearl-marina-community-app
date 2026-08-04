import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HOMEOWNER_ID_PRIVACY_VERSION } from "@/lib/homeowner-identification";

export default function HomeownerIdPrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader><CardTitle>Homeowner ID privacy notice</CardTitle><CardDescription>Version {HOMEOWNER_ID_PRIVACY_VERSION}</CardDescription></CardHeader>
        <CardContent className="space-y-5 text-sm leading-7 text-muted-foreground">
          <p>Pearl Marina HOA collects one image of a government-issued photo ID to help a community manager compare the applicant’s confirmed name and photograph while reviewing homeowner access.</p>
          <p>The image is stored privately by Supabase. Google Cloud Vision processes it to suggest a name. We do not retain the complete OCR response or intentionally extract or store ID numbers. OCR is only an aid; a manager makes the decision.</p>
          <p>Only active community managers may request a five-minute viewing link. Each request is recorded in an access audit. Other residents, homeowners, service providers, administrators, and public visitors cannot view the image through the app.</p>
          <p>The image is deleted 30 days after approval or rejection. An undecided application expires after 60 days and its image is deleted. An abandoned upload is deleted after 24 hours. Operational records needed to prove the review and deletion may remain.</p>
          <p>Do not submit an ID unless you accept this processing. For a privacy request or incident report, contact the Pearl Marina HOA community management team through the community’s established contact channel.</p>
          <Link href="/signup" className="inline-block font-medium text-primary underline">Return to application</Link>
        </CardContent>
      </Card>
    </main>
  );
}
