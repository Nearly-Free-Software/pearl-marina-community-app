export type CommunityRole = "admin" | "community_manager" | "homeowner" | "resident" | "service_provider";
export type AccessStatus = "active" | "disabled";
export type SubCommunity =
  | "Bella Vista Apartments"
  | "Mirabella and Signature Villas"
  | "La Perla Bungalows"
  | "Riviera Townhouses"
  | "Kingswood Park";
export type HomeownerApplicationStatus = "pending" | "approved" | "rejected" | "expired";
export type HomeownerIdOcrStatus = "pending" | "name_found" | "no_name" | "failed";

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
  id_required: boolean;
  id_image_path: string | null;
  id_image_mime_type: string | null;
  id_image_size: number | null;
  id_ocr_status: HomeownerIdOcrStatus | null;
  id_ocr_suggested_name: string | null;
  name_confirmed_at: string | null;
  privacy_notice_version: string | null;
  privacy_accepted_at: string | null;
  id_verified_at: string | null;
  id_verified_by: string | null;
  id_delete_after: string | null;
  id_deleted_at: string | null;
  expired_at: string | null;
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
  resident_sub_community: SubCommunity | null;
  resident_unit_number: string | null;
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
        Insert: Pick<HomeownerApplication, "full_name" | "email" | "phone" | "sub_community" | "unit_number"> & {
          id?: string;
          status?: HomeownerApplicationStatus;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          auth_user_id?: string | null;
          invitation_sent_at?: string | null;
          invitation_error?: string | null;
          id_required?: boolean;
          id_image_path?: string | null;
          id_image_mime_type?: string | null;
          id_image_size?: number | null;
          id_ocr_status?: HomeownerIdOcrStatus | null;
          id_ocr_suggested_name?: string | null;
          name_confirmed_at?: string | null;
          privacy_notice_version?: string | null;
          privacy_accepted_at?: string | null;
          id_verified_at?: string | null;
          id_verified_by?: string | null;
          id_delete_after?: string | null;
          id_deleted_at?: string | null;
          expired_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<HomeownerApplication>;
        Relationships: [];
      };
      homeowner_id_upload_drafts: {
        Row: {
          id: string; email: string; token_hash: string; ip_hash: string; storage_path: string;
          mime_type: string | null; file_size: number | null; ocr_status: HomeownerIdOcrStatus;
          ocr_suggested_name: string | null; processed_at: string | null; consumed_at: string | null;
          expires_at: string; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; email: string; token_hash: string; ip_hash: string; storage_path: string;
          mime_type?: string | null; file_size?: number | null; ocr_status?: HomeownerIdOcrStatus;
          ocr_suggested_name?: string | null; processed_at?: string | null; consumed_at?: string | null;
          expires_at?: string; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["homeowner_id_upload_drafts"]["Row"]>;
        Relationships: [];
      };
      homeowner_id_rate_limits: {
        Row: { id: number; email_hash: string; ip_hash: string; event_type: "upload" | "ocr"; created_at: string };
        Insert: { id?: number; email_hash: string; ip_hash: string; event_type: "upload" | "ocr"; created_at?: string };
        Update: never;
        Relationships: [];
      };
      homeowner_id_access_log: {
        Row: { id: number; application_id: string; manager_id: string; accessed_at: string };
        Insert: { id?: number; application_id: string; manager_id: string; accessed_at?: string };
        Update: never;
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
      homeowner_id_ocr_status: HomeownerIdOcrStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
