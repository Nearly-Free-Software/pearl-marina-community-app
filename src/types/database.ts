export type CommunityRole = "admin" | "homeowner" | "resident" | "service_provider";
export type AccessStatus = "active" | "disabled";

export type Profile = { id: string; display_name: string | null; email: string; role: CommunityRole; access_status: AccessStatus; created_at: string; updated_at: string };
export type VisitorPass = {
  id: string;
  resident_id: string;
  guest_name: string;
  guest_phone: string;
  valid_from: string;
  valid_until: string;
  token_hash: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VisitorPassVerification = {
  status: "valid" | "not_yet_valid" | "expired" | "revoked" | "invalid";
  guest_name: string | null;
  resident_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<Pick<Profile, "display_name">>;
        Relationships: [];
      };
      visitor_passes: {
        Row: VisitorPass;
        Insert: Omit<VisitorPass, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<VisitorPass, "token_hash" | "revoked_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      verify_visitor_pass: {
        Args: { p_token_hash: string };
        Returns: VisitorPassVerification[];
      };
    };
    Enums: { community_role: CommunityRole; access_status: AccessStatus };
    CompositeTypes: Record<string, never>;
  };
};
