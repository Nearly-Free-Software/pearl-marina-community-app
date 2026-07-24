"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVisitorPass, type VisitorActionState } from "../actions";

const initialState: VisitorActionState = {};

export function VisitorForm() {
  const [state, action, pending] = useActionState(createVisitorPass, initialState);
  const [duration, setDuration] = useState("today");

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="guest_name">Guest name</label>
        <Input id="guest_name" name="guest_name" autoComplete="name" maxLength={100} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="guest_phone">Phone number</label>
        <Input
          id="guest_phone"
          name="guest_phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+256 700 000000"
          required
        />
        <p className="text-xs leading-5 text-muted-foreground">Include the country code. This number is never shown on the public pass.</p>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Access duration</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["today", "Today"],
            ["24_hours", "24 hours"],
            ["custom", "Custom"],
          ].map(([value, label]) => (
            <label
              key={value}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-3 text-center text-sm font-medium ${duration === value ? "border-primary bg-secondary text-secondary-foreground ring-1 ring-primary" : "bg-card"}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="duration"
                value={value}
                checked={duration === value}
                onChange={() => setDuration(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {duration === "custom" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="custom_start">Starts</label>
            <Input id="custom_start" name="custom_start" type="datetime-local" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="custom_end">Ends</label>
            <Input id="custom_end" name="custom_end" type="datetime-local" required />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">Times use East Africa Time.</p>
        </div>
      ) : null}
      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="outline"><Link href="/visitors">Cancel</Link></Button>
        <Button type="submit" disabled={pending}>{pending ? "Creating pass…" : "Create visitor pass"}</Button>
      </div>
    </form>
  );
}
