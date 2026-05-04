export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      handovers: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          from_user: string
          id: string
          notes: string
          to_user: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          from_user: string
          id?: string
          notes: string
          to_user?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          from_user?: string
          id?: string
          notes?: string
          to_user?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          game_id: string
          id: string
          low_threshold: number
          package_name: string
          stock: number
          updated_at: string
        }
        Insert: {
          game_id: string
          id?: string
          low_threshold?: number
          package_name: string
          stock?: number
          updated_at?: string
        }
        Update: {
          game_id?: string
          id?: string
          low_threshold?: number
          package_name?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          assigned_to: string | null
          body: string
          channel: string
          created_at: string
          customer_id: string | null
          direction: string
          id: string
          order_id: string | null
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          channel?: string
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          channel?: string
          created_at?: string
          customer_id?: string | null
          direction?: string
          id?: string
          order_id?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          mentions: string[]
          order_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          mentions?: string[]
          order_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          order_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_name: string | null
          archived_at: string | null
          created_at: string
          game_id: string
          game_name: string
          id: string
          package_name: string
          payment_method: string
          player_uid: string
          price: number
          receipt_url: string | null
          server: string
          status: string
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          admin_name?: string | null
          archived_at?: string | null
          created_at?: string
          game_id: string
          game_name: string
          id?: string
          package_name: string
          payment_method: string
          player_uid: string
          price: number
          receipt_url?: string | null
          server: string
          status?: string
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          admin_name?: string | null
          archived_at?: string | null
          created_at?: string
          game_id?: string
          game_name?: string
          id?: string
          package_name?: string
          payment_method?: string
          player_uid?: string
          price?: number
          receipt_url?: string | null
          server?: string
          status?: string
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          phone: string | null
          total_diamonds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone?: string | null
          total_diamonds?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string | null
          total_diamonds?: number
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          customer_name: string
          id: string
          platform: string
          rating: number
          review_text: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_name: string
          id?: string
          platform?: string
          rating?: number
          review_text: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string
          id?: string
          platform?: string
          rating?: number
          review_text?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          archived_at: string | null
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          archived_at?: string | null
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          archived_at?: string | null
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      staff_cd_keys: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          code_hash: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          label: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          code_hash: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          code_hash?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          shift_end: string
          shift_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          shift_end: string
          shift_start: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          shift_end?: string
          shift_start?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_sessions: {
        Row: {
          device_id: string | null
          elevated_until: string | null
          ended_at: string | null
          ended_reason: string | null
          id: string
          ip: string | null
          is_idle: boolean
          last_ping: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_id?: string | null
          elevated_until?: string | null
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          ip?: string | null
          is_idle?: boolean
          last_ping?: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_id?: string | null
          elevated_until?: string | null
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          ip?: string | null
          is_idle?: boolean
          last_ping?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      store_status: {
        Row: {
          admin_name: string | null
          id: string
          is_open: boolean
          updated_at: string
        }
        Insert: {
          admin_name?: string | null
          id?: string
          is_open?: boolean
          updated_at?: string
        }
        Update: {
          admin_name?: string | null
          id?: string
          is_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_diamonds: {
        Args: { p_diamonds: number; p_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_new_user: {
        Args: { p_phone?: string; p_user_id: string }
        Returns: undefined
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "client" | "moderator" | "admin" | "owner"
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
  public: {
    Enums: {
      app_role: ["client", "moderator", "admin", "owner"],
    },
  },
} as const
