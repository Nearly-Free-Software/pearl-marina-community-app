export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      homeowner_applications: {
        Row: {
          anonymized_at: string | null
          auth_user_id: string | null
          created_at: string
          email: string | null
          expired_at: string | null
          full_name: string | null
          id: string
          id_delete_after: string | null
          id_deleted_at: string | null
          id_image_mime_type: string | null
          id_image_path: string | null
          id_image_size: number | null
          id_ocr_status:
            | Database["public"]["Enums"]["homeowner_id_ocr_status"]
            | null
          id_ocr_suggested_name: string | null
          id_required: boolean
          id_verified_at: string | null
          id_verified_by: string | null
          invitation_error: string | null
          invitation_sent_at: string | null
          name_confirmed_at: string | null
          phone: string | null
          privacy_accepted_at: string | null
          privacy_notice_version: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["homeowner_application_status"]
          sub_community: Database["public"]["Enums"]["sub_community"] | null
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          anonymized_at?: string | null
          auth_user_id?: string | null
          created_at?: string
          email: string
          expired_at?: string | null
          full_name: string
          id?: string
          id_delete_after?: string | null
          id_deleted_at?: string | null
          id_image_mime_type?: string | null
          id_image_path?: string | null
          id_image_size?: number | null
          id_ocr_status?:
            | Database["public"]["Enums"]["homeowner_id_ocr_status"]
            | null
          id_ocr_suggested_name?: string | null
          id_required?: boolean
          id_verified_at?: string | null
          id_verified_by?: string | null
          invitation_error?: string | null
          invitation_sent_at?: string | null
          name_confirmed_at?: string | null
          phone: string
          privacy_accepted_at?: string | null
          privacy_notice_version?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["homeowner_application_status"]
          sub_community: Database["public"]["Enums"]["sub_community"]
          unit_number: string
          updated_at?: string
        }
        Update: {
          anonymized_at?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          expired_at?: string | null
          full_name?: string | null
          id?: string
          id_delete_after?: string | null
          id_deleted_at?: string | null
          id_image_mime_type?: string | null
          id_image_path?: string | null
          id_image_size?: number | null
          id_ocr_status?:
            | Database["public"]["Enums"]["homeowner_id_ocr_status"]
            | null
          id_ocr_suggested_name?: string | null
          id_required?: boolean
          id_verified_at?: string | null
          id_verified_by?: string | null
          invitation_error?: string | null
          invitation_sent_at?: string | null
          name_confirmed_at?: string | null
          phone?: string | null
          privacy_accepted_at?: string | null
          privacy_notice_version?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["homeowner_application_status"]
          sub_community?: Database["public"]["Enums"]["sub_community"] | null
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homeowner_id_access_log: {
        Row: {
          accessed_at: string
          application_id: string
          id: number
          manager_id: string | null
        }
        Insert: {
          accessed_at?: string
          application_id: string
          id?: never
          manager_id: string
        }
        Update: {
          accessed_at?: string
          application_id?: string
          id?: never
          manager_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homeowner_id_access_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "homeowner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      homeowner_id_rate_limits: {
        Row: {
          created_at: string
          email_hash: string
          event_type: string
          id: number
          ip_hash: string
        }
        Insert: {
          created_at?: string
          email_hash: string
          event_type: string
          id?: never
          ip_hash: string
        }
        Update: {
          created_at?: string
          email_hash?: string
          event_type?: string
          id?: never
          ip_hash?: string
        }
        Relationships: []
      }
      homeowner_id_upload_drafts: {
        Row: {
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          file_size: number | null
          id: string
          ip_hash: string
          mime_type: string | null
          ocr_status: Database["public"]["Enums"]["homeowner_id_ocr_status"]
          ocr_suggested_name: string | null
          processed_at: string | null
          storage_path: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          file_size?: number | null
          id?: string
          ip_hash: string
          mime_type?: string | null
          ocr_status?: Database["public"]["Enums"]["homeowner_id_ocr_status"]
          ocr_suggested_name?: string | null
          processed_at?: string | null
          storage_path: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          file_size?: number | null
          id?: string
          ip_hash?: string
          mime_type?: string | null
          ocr_status?: Database["public"]["Enums"]["homeowner_id_ocr_status"]
          ocr_suggested_name?: string | null
          processed_at?: string | null
          storage_path?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_status: Database["public"]["Enums"]["access_status"]
          created_at: string
          display_name: string | null
          email: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["community_role"]
          sub_community: Database["public"]["Enums"]["sub_community"] | null
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          access_status?: Database["public"]["Enums"]["access_status"]
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["community_role"]
          sub_community?: Database["public"]["Enums"]["sub_community"] | null
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          access_status?: Database["public"]["Enums"]["access_status"]
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["community_role"]
          sub_community?: Database["public"]["Enums"]["sub_community"] | null
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      visitor_passes: {
        Row: {
          created_at: string
          guest_name: string
          guest_phone: string
          id: string
          request_key: string
          resident_id: string
          revoked_at: string | null
          token_hash: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          guest_name: string
          guest_phone: string
          id?: string
          request_key: string
          resident_id: string
          revoked_at?: string | null
          token_hash: string
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          request_key?: string
          resident_id?: string
          revoked_at?: string | null
          token_hash?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_passes_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_pass_tokens: {
        Row: {
          created_at: string
          encrypted_token: string
          visitor_pass_id: string
        }
        Insert: {
          created_at?: string
          encrypted_token: string
          visitor_pass_id: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      verify_visitor_pass: {
        Args: { p_token_hash: string }
        Returns: {
          guest_name: string
          resident_name: string
          resident_sub_community: Database["public"]["Enums"]["sub_community"] | null
          resident_unit_number: string | null
          status: string
          valid_from: string
          valid_until: string
        }[]
      }
    }
    Enums: {
      access_status: "active" | "disabled"
      community_role:
        | "admin"
        | "community_manager"
        | "homeowner"
        | "resident"
        | "service_provider"
      homeowner_application_status:
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
      homeowner_id_ocr_status: "pending" | "name_found" | "no_name" | "failed"
      sub_community:
        | "Bella Vista Apartments"
        | "Mirabella and Signature Villas"
        | "La Perla Bungalows"
        | "Riviera Townhouses"
        | "Kingswood Park"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_status: ["active", "disabled"],
      community_role: [
        "admin",
        "community_manager",
        "homeowner",
        "resident",
        "service_provider",
      ],
      homeowner_application_status: [
        "pending",
        "approved",
        "rejected",
        "expired",
      ],
      homeowner_id_ocr_status: ["pending", "name_found", "no_name", "failed"],
      sub_community: [
        "Bella Vista Apartments",
        "Mirabella and Signature Villas",
        "La Perla Bungalows",
        "Riviera Townhouses",
        "Kingswood Park",
      ],
    },
  },
} as const
