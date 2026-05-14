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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements_catalog: {
        Row: {
          code: string
          description: string
          icon: string
          pro_only: boolean
          sort_order: number
          tier: string
          title: string
          xp_reward: number
        }
        Insert: {
          code: string
          description: string
          icon: string
          pro_only?: boolean
          sort_order?: number
          tier?: string
          title: string
          xp_reward?: number
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          pro_only?: boolean
          sort_order?: number
          tier?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      challenges_catalog: {
        Row: {
          active: boolean
          code: string
          description: string
          icon: string
          metric: string
          period: Database["public"]["Enums"]["challenge_period"]
          pro_only: boolean
          sort_order: number
          target_value: number
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          code: string
          description: string
          icon?: string
          metric: string
          period?: Database["public"]["Enums"]["challenge_period"]
          pro_only?: boolean
          sort_order?: number
          target_value: number
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          code?: string
          description?: string
          icon?: string
          metric?: string
          period?: Database["public"]["Enums"]["challenge_period"]
          pro_only?: boolean
          sort_order?: number
          target_value?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string | null
          id: string
          occurred_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          achieved: boolean
          created_at: string
          ends_at: string
          id: string
          period: Database["public"]["Enums"]["goal_period"]
          starts_at: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          user_id: string
        }
        Insert: {
          achieved?: boolean
          created_at?: string
          ends_at: string
          id?: string
          period?: Database["public"]["Enums"]["goal_period"]
          starts_at: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          user_id: string
        }
        Update: {
          achieved?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          period?: Database["public"]["Enums"]["goal_period"]
          starts_at?: string
          target_value?: number
          type?: Database["public"]["Enums"]["goal_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          current_streak_days: number
          email: string | null
          full_name: string | null
          id: string
          last_activity_date: string | null
          level: number
          monthly_goal: number | null
          onboarding_completed: boolean
          plan: Database["public"]["Enums"]["app_plan"]
          profession_type: string | null
          updated_at: string
          xp: number
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          current_streak_days?: number
          email?: string | null
          full_name?: string | null
          id: string
          last_activity_date?: string | null
          level?: number
          monthly_goal?: number | null
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["app_plan"]
          profession_type?: string | null
          updated_at?: string
          xp?: number
        }
        Update: {
          business_name?: string | null
          created_at?: string
          current_streak_days?: number
          email?: string | null
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number
          monthly_goal?: number | null
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["app_plan"]
          profession_type?: string | null
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          address: string | null
          agreed_price: number
          client_name: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          received_price: number | null
          scheduled_at: string | null
          service_type: string
          status: Database["public"]["Enums"]["service_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          agreed_price?: number
          client_name: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          received_price?: number | null
          scheduled_at?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          agreed_price?: number
          client_name?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          received_price?: number | null
          scheduled_at?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_code: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_code: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_code?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_code_fkey"
            columns: ["achievement_code"]
            isOneToOne: false
            referencedRelation: "achievements_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_code: string
          completed_at: string | null
          id: string
          period_start: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_code: string
          completed_at?: string | null
          id?: string
          period_start: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_code?: string
          completed_at?: string | null
          id?: string
          period_start?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_code_fkey"
            columns: ["challenge_code"]
            isOneToOne: false
            referencedRelation: "challenges_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_plan: "free" | "pro"
      challenge_period: "weekly" | "monthly"
      expense_category:
        | "combustivel"
        | "alimentacao"
        | "ferramentas"
        | "transporte"
        | "materiais"
        | "equipe"
        | "outros"
      goal_period: "week" | "month"
      goal_type: "revenue" | "profit" | "services_count"
      service_status: "scheduled" | "in_progress" | "completed" | "cancelled"
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
      app_plan: ["free", "pro"],
      challenge_period: ["weekly", "monthly"],
      expense_category: [
        "combustivel",
        "alimentacao",
        "ferramentas",
        "transporte",
        "materiais",
        "equipe",
        "outros",
      ],
      goal_period: ["week", "month"],
      goal_type: ["revenue", "profit", "services_count"],
      service_status: ["scheduled", "in_progress", "completed", "cancelled"],
    },
  },
} as const
