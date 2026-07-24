import Link from "next/link";
import { ArrowRight, LogIn, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">PM</div>
            <div>
              <p className="font-semibold tracking-tight">Pearl Marina</p>
              <p className="text-xs text-muted-foreground">Community portal</p>
            </div>
          </div>
          <Button asChild variant="outline"><Link href="/login">Sign in</Link></Button>
        </header>

        <section className="flex flex-1 flex-col justify-center py-20">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Private access for our community</p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">One calm place for life at Pearl Marina.</h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">A mobile-first home for homeowners, residents, and the teams who help our community run smoothly. Homeowners can apply for access and a community manager will verify their details.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/signup">Apply for homeowner access <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/login"><LogIn className="size-4" />Already have access? Sign in</Link></Button>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground"><Smartphone className="size-4" />Designed for quick, secure access on any device.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
