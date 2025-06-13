export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key_value: string
          model: string | null
          name: string
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_value: string
          model?: string | null
          name: string
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_value?: string
          model?: string | null
          name?: string
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          name: string
          plan_tier: string | null
          provider: string
          token_type: string
          token_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          plan_tier?: string | null
          provider: string
          token_type?: string
          token_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          plan_tier?: string | null
          provider?: string
          token_type?: string
          token_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          id: string
          model: string
          provider: string
          request_data: Json | null
          response_data: Json | null
          response_time_ms: number | null
          status: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model: string
          provider: string
          request_data?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          model?: string
          provider?: string
          request_data?: Json | null
          response_data?: Json | null
          response_time_ms?: number | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_tracking: {
        Row: {
          api_key_id: string
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          id: string
          provider: string
          request_type: string
          response_time_ms: number | null
          success: boolean | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider: string
          request_type: string
          response_time_ms?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string
          request_type?: string
          response_time_ms?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_schedules: {
        Row: {
          backup_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          schedule_cron: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backup_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          schedule_cron: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backup_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          schedule_cron?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deployment_tokens: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          token_name: string
          token_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          token_name: string
          token_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          token_name?: string
          token_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deployments: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          status: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          status?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          status?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_management: {
        Row: {
          created_at: string | null
          dns_configured: boolean | null
          domain_name: string
          id: string
          ssl_enabled: boolean | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string | null
          dns_configured?: boolean | null
          domain_name: string
          id?: string
          ssl_enabled?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string | null
          dns_configured?: boolean | null
          domain_name?: string
          id?: string
          ssl_enabled?: boolean | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      email_configurations: {
        Row: {
          created_at: string | null
          from_email: string | null
          google_access_token: string | null
          google_client_id: string | null
          google_client_secret: string | null
          google_refresh_token: string | null
          id: string
          is_active: boolean | null
          provider: string
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_email?: string | null
          google_access_token?: string | null
          google_client_id?: string | null
          google_client_secret?: string | null
          google_refresh_token?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_email?: string | null
          google_access_token?: string | null
          google_client_id?: string | null
          google_client_secret?: string | null
          google_refresh_token?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      file_storage: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          public_url: string | null
          storage_path: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          public_url?: string | null
          storage_path: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          public_url?: string | null
          storage_path?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      github_api_keys: {
        Row: {
          api_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          rate_limit_limit: number | null
          rate_limit_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          rate_limit_limit?: number | null
          rate_limit_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          rate_limit_limit?: number | null
          rate_limit_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      model_pricing: {
        Row: {
          created_at: string | null
          id: string
          input_cost_per_token: number | null
          is_active: boolean | null
          model: string
          output_cost_per_token: number | null
          plan_tier: string | null
          provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_cost_per_token?: number | null
          is_active?: boolean | null
          model: string
          output_cost_per_token?: number | null
          plan_tier?: string | null
          provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          input_cost_per_token?: number | null
          is_active?: boolean | null
          model?: string
          output_cost_per_token?: number | null
          plan_tier?: string | null
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      netlify_api_keys: {
        Row: {
          api_token: string
          created_at: string | null
          deployments_count: number | null
          deployments_limit: number | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_token: string
          created_at?: string | null
          deployments_count?: number | null
          deployments_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_token?: string
          created_at?: string | null
          deployments_count?: number | null
          deployments_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      openrouter_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          credits_limit: number | null
          credits_used: number | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          requests_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          credits_limit?: number | null
          credits_used?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          requests_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          credits_limit?: number | null
          credits_used?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          requests_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_chat_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type: string
          metadata?: Json | null
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_chat_history_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_verification_requests: {
        Row: {
          admin_notes: string | null
          id: string
          project_id: string
          request_message: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          id?: string
          project_id: string
          request_message?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          id?: string
          project_id?: string
          request_message?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_verification_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          channel_data: Json | null
          created_at: string | null
          description: string | null
          github_url: string | null
          id: string
          name: string
          netlify_url: string | null
          source_code: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          youtube_url: string | null
        }
        Insert: {
          channel_data?: Json | null
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          name: string
          netlify_url?: string | null
          source_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          youtube_url?: string | null
        }
        Update: {
          channel_data?: Json | null
          created_at?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          name?: string
          netlify_url?: string | null
          source_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      storage_usage_tracking: {
        Row: {
          bucket_name: string
          file_count: number | null
          id: string
          last_updated: string | null
          total_size_bytes: number | null
          user_id: string | null
        }
        Insert: {
          bucket_name: string
          file_count?: number | null
          id?: string
          last_updated?: string | null
          total_size_bytes?: number | null
          user_id?: string | null
        }
        Update: {
          bucket_name?: string
          file_count?: number | null
          id?: string
          last_updated?: string | null
          total_size_bytes?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_monitoring: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string | null
          events: string[] | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          secret: string | null
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      youtube_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          quota_limit: number | null
          quota_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          quota_limit?: number | null
          quota_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          quota_limit?: number | null
          quota_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
