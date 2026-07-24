"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Check, Copy, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function QrPass({ passUrl, guestName }: { passUrl: string; guestName: string }) {
  const [dataUrl, setDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(passUrl, { width: 720, margin: 2, errorCorrectionLevel: "M" }).then(setDataUrl);
  }, [passUrl]);

  async function share() {
    if (!passUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: `Pearl Marina visitor pass for ${guestName}`,
        text: `Here is your Pearl Marina visitor pass. Present the QR code at the gate.`,
        url: passUrl,
      });
      return;
    }
    await copy();
  }

  async function copy() {
    await navigator.clipboard.writeText(passUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="mx-auto aspect-square w-full max-w-72 rounded-xl border bg-white p-3">
        {dataUrl ? <Image src={dataUrl} width={720} height={720} unoptimized alt={`Visitor QR code for ${guestName}`} className="size-full" /> : <div className="size-full animate-pulse rounded-lg bg-muted" />}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Button type="button" onClick={share}><Share2 className="size-4" /> Share</Button>
        <Button type="button" variant="outline" onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy link"}</Button>
        <Button asChild variant="outline">
          <a href={dataUrl} download={`pearl-marina-${guestName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-pass.png`}><Download className="size-4" /> Download</a>
        </Button>
      </div>
    </div>
  );
}
