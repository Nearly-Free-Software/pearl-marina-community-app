import type { CommunityRole } from "@/types/database";

export type DeleteAccountState = { error: string | null };

export const initialDeleteAccountState: DeleteAccountState = { error: null };

export function accountDeletionError({
  role,
  accountEmail,
  confirmationEmail,
}: {
  role: CommunityRole;
  accountEmail: string;
  confirmationEmail: string;
}) {
  if (role === "admin" || role === "community_manager") {
    return "Administrator and community manager accounts must be removed by a trusted system administrator.";
  }

  if (!confirmationEmail || confirmationEmail.trim().toLowerCase() !== accountEmail.trim().toLowerCase()) {
    return "Enter your account email address exactly as shown to confirm deletion.";
  }

  return null;
}
