"use client";

import { LoaderCircle } from "lucide-react";
import { useLinkStatus } from "next/link";

export function LinkStatus({ label = "Loading page" }: { label?: string }) {
  const { pending } = useLinkStatus();

  return (
    <span className="relative size-4 shrink-0" aria-live="polite">
      <LoaderCircle
        className={`absolute inset-0 size-4 animate-spin motion-reduce:animate-none ${pending ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      />
      <span className="sr-only">{pending ? label : ""}</span>
    </span>
  );
}
