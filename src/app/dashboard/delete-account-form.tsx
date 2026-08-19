"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PendingButton } from "@/components/ui/pending-button";
import { initialDeleteAccountState } from "@/lib/account-deletion";
import { deleteAccount } from "./actions";

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action] = useActionState(deleteAccount, initialDeleteAccountState);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="delete-account-email" className="text-sm font-medium">
          Enter {email} to confirm
        </label>
        <Input
          id="delete-account-email"
          name="email"
          type="email"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </div>
      {state.error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{state.error}</p> : null}
      <PendingButton variant="outline" pendingLabel="Deleting account…" className="w-full border-red-300 text-red-800 hover:bg-red-50 hover:text-red-900">
        <Trash2 className="size-4" /> Delete my account permanently
      </PendingButton>
    </form>
  );
}
