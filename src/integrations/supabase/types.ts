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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_extraction_settings: {
        Row: {
          custom_instructions: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          custom_instructions?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          custom_instructions?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      aposta: {
        Row: {
          bonus: number | null
          casa_de_apostas: string | null
          categoria: string | null
          data: string | null
          detalhes: string | null
          id: number
          is_super_odd: boolean | null
          odd: number | null
          partida: string | null
          resultado: string | null
          tipo_aposta: string | null
          torneio: string | null
          turbo: number | null
          user_id: string | null
          valor_apostado: number | null
          valor_final: number | null
        }
        Insert: {
          bonus?: number | null
          casa_de_apostas?: string | null
          categoria?: string | null
          data?: string | null
          detalhes?: string | null
          id?: number
          is_super_odd?: boolean | null
          odd?: number | null
          partida?: string | null
          resultado?: string | null
          tipo_aposta?: string | null
          torneio?: string | null
          turbo?: number | null
          user_id?: string | null
          valor_apostado?: number | null
          valor_final?: number | null
        }
        Update: {
          bonus?: number | null
          casa_de_apostas?: string | null
          categoria?: string | null
          data?: string | null
          detalhes?: string | null
          id?: number
          is_super_odd?: boolean | null
          odd?: number | null
          partida?: string | null
          resultado?: string | null
          tipo_aposta?: string | null
          torneio?: string | null
          turbo?: number | null
          user_id?: string | null
          valor_apostado?: number | null
          valor_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aposta_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookies: {
        Row: {
          balance: number | null
          created_at: string | null
          id: number
          last_deposit: string | null
          last_update: string | null
          last_withdraw: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: number
          last_deposit?: string | null
          last_update?: string | null
          last_withdraw?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: number
          last_deposit?: string | null
          last_update?: string | null
          last_withdraw?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          daily_goal: number | null
          id: number
          loss_limit: number | null
          monthly_goal: number | null
          result: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_goal?: number | null
          id?: number
          loss_limit?: number | null
          monthly_goal?: number | null
          result?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_goal?: number | null
          id?: number
          loss_limit?: number | null
          monthly_goal?: number | null
          result?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_saldos: {
        Row: {
          casa_nome: string | null
          data: string | null
          id: number
          observacao: string | null
          operacao: string | null
          saldo_resultante: number | null
          valor: number | null
        }
        Insert: {
          casa_nome?: string | null
          data?: string | null
          id?: number
          observacao?: string | null
          operacao?: string | null
          saldo_resultante?: number | null
          valor?: number | null
        }
        Update: {
          casa_nome?: string | null
          data?: string | null
          id?: number
          observacao?: string | null
          operacao?: string | null
          saldo_resultante?: number | null
          valor?: number | null
        }
        Relationships: []
      }
      metas: {
        Row: {
          concluida: boolean | null
          data_criacao: string | null
          data_limite: string | null
          id: number
          titulo: string | null
          valor_alvo: number | null
        }
        Insert: {
          concluida?: boolean | null
          data_criacao?: string | null
          data_limite?: string | null
          id?: number
          titulo?: string | null
          valor_alvo?: number | null
        }
        Update: {
          concluida?: boolean | null
          data_criacao?: string | null
          data_limite?: string | null
          id?: number
          titulo?: string | null
          valor_alvo?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          password_hash: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saldo_casas: {
        Row: {
          casa_nome: string | null
          id: number
          saldo: number | null
          ultima_atualizacao: string | null
        }
        Insert: {
          casa_nome?: string | null
          id?: number
          saldo?: number | null
          ultima_atualizacao?: string | null
        }
        Update: {
          casa_nome?: string | null
          id?: number
          saldo?: number | null
          ultima_atualizacao?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          bookie_id: number | null
          created_at: string | null
          description: string | null
          id: number
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          bookie_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          bookie_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bookie_id_fkey"
            columns: ["bookie_id"]
            isOneToOne: false
            referencedRelation: "bookies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_custom_user: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      create_custom_user: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
