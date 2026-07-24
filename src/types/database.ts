export type CommunityRole = "admin" | "community_manager" | "homeowner" | "resident" | "service_provider";
export type AccessStatus = "active" | "disabled";
export type SubCommunity =
  | "Bella Vista Apartments"
  | "Mirabella Villas"
  | "La Perla Bungalows"
  | "Riviera Townhouses"
  | "Kingswood Homes";
export type HomeownerApplicationStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  sub_community: SubCommunity | null;
  unit_number: string | null;
  role: CommunityRole;
  access_status: AccessStatus;
  created_at: string;
  updated_at: string;
};
export type HomeownerApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  sub_community: SubCommunity;
  unit_number: string;
  status: HomeownerApplicationStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  auth_user_id: string | null;
  invitation_sent_at: string | null;
  invitation_error: string | null;
  created_at: string;
  updated_at: string;
};
export type VisitorPass = {
  id: string;
  resident_id: string;
  guest_name: string;
  guest_phone: string;
  request_key: string;
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
        Update: Partial<Profile>;
        Relationships: [];
      };
      homeowner_applications: {
        Row: HomeownerApplication;
        Insert: Omit<HomeownerApplication, "id" | "status" | "reviewed_at" | "reviewed_by" | "rejection_reason" | "auth_user_id" | "invitation_sent_at" | "invitation_error" | "created_at" | "updated_at"> & {
          id?: string;
          status?: HomeownerApplicationStatus;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          auth_user_id?: string | null;
          invitation_sent_at?: string | null;
          invitation_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<HomeownerApplication>;
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
    Enums: {
      community_role: CommunityRole;
      access_status: AccessStatus;
      sub_community: SubCommunity;
      homeowner_application_status: HomeownerApplicationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
