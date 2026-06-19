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
      assinaturas: {
        Row: {
          criado_em: string
          email: string
          expira_em: string | null
          id: string
          nome: string
          plano: Database["public"]["Enums"]["plano_tipo"]
          status: Database["public"]["Enums"]["assinatura_status"]
          telefone: string | null
          token_id: string | null
          token_valor: string | null
          updated_at: string
          valor_centavos: number
        }
        Insert: {
          criado_em?: string
          email: string
          expira_em?: string | null
          id?: string
          nome: string
          plano: Database["public"]["Enums"]["plano_tipo"]
          status?: Database["public"]["Enums"]["assinatura_status"]
          telefone?: string | null
          token_id?: string | null
          token_valor?: string | null
          updated_at?: string
          valor_centavos: number
        }
        Update: {
          criado_em?: string
          email?: string
          expira_em?: string | null
          id?: string
          nome?: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          status?: Database["public"]["Enums"]["assinatura_status"]
          telefone?: string | null
          token_id?: string | null
          token_valor?: string | null
          updated_at?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_checkout: {
        Row: {
          atualizado_em: string
          checkout_id: string | null
          comprado_em: string | null
          criado_em: string
          email: string
          fbclid: string | null
          id: string
          idioma: string
          nome: string
          origem: string
          payment_id: string | null
          payment_provider: string | null
          plano: string
          status_venda: string
          telefone: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          atualizado_em?: string
          checkout_id?: string | null
          comprado_em?: string | null
          criado_em?: string
          email: string
          fbclid?: string | null
          id?: string
          idioma?: string
          nome: string
          origem?: string
          payment_id?: string | null
          payment_provider?: string | null
          plano: string
          status_venda?: string
          telefone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          atualizado_em?: string
          checkout_id?: string | null
          comprado_em?: string | null
          criado_em?: string
          email?: string
          fbclid?: string | null
          id?: string
          idioma?: string
          nome?: string
          origem?: string
          payment_id?: string | null
          payment_provider?: string | null
          plano?: string
          status_venda?: string
          telefone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      tokens: {
        Row: {
          assinatura_id: string | null
          criado_em: string
          id: string
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: Database["public"]["Enums"]["token_status"]
          token: string
          usado_em: string | null
        }
        Insert: {
          assinatura_id?: string | null
          criado_em?: string
          id?: string
          plano?: Database["public"]["Enums"]["plano_tipo"] | null
          status?: Database["public"]["Enums"]["token_status"]
          token: string
          usado_em?: string | null
        }
        Update: {
          assinatura_id?: string | null
          criado_em?: string
          id?: string
          plano?: Database["public"]["Enums"]["plano_tipo"] | null
          status?: Database["public"]["Enums"]["token_status"]
          token?: string
          usado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_assinatura_fk"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      assinatura_status: "pendente" | "aprovado" | "rejeitado" | "expirado"
      plano_tipo: "diario" | "mensal" | "trimestral" | "anual"
      token_status: "disponivel" | "usado"
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
      assinatura_status: ["pendente", "aprovado", "rejeitado", "expirado"],
      plano_tipo: ["diario", "mensal", "trimestral", "anual"],
      token_status: ["disponivel", "usado"],
    },
  },
} as const
