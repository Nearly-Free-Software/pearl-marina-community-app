export type CommunityRole = "admin" | "homeowner" | "resident" | "service_provider";
export type AccessStatus = "active" | "disabled";

export type Profile = { id: string; display_name: string | null; email: string; role: CommunityRole; access_status: AccessStatus; created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<Pick<Profile, "display_name">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { community_role: CommunityRole; access_status: AccessStatus };
    CompositeTypes: Record<string, never>;
  };
};
