"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PassLink({ passUrl, guestName }: { passUrl: string; guestName: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(passUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: `Pearl Marina visitor pass for ${guestName}`,
        text: `Here is your Pearl Marina visitor pass link. Open it at the gate to verify access.`,
        url: passUrl,
      });
      return;
    }
    await copy();
  }

  return (
    <div className="space-y-4 rounded-xl border bg-secondary/30 p-4">
      <div>
        <p className="font-medium">Visitor pass link</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Share this live link with your guest. It will show whether the pass is currently valid.</p>
      </div>
      <input readOnly value={passUrl} aria-label="Visitor pass link" className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" onFocus={(event) => event.currentTarget.select()} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={share}><Share2 className="size-4" /> Share link</Button>
        <Button type="button" variant="outline" onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy link"}</Button>
      </div>
    </div>
  );
}
