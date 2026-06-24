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
      assinaturas_br: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          cakto_event_id: string | null
          campaign_id: string | null
          canal_fechamento: string | null
          checkout_id: string | null
          comprado_em: string | null
          criado_em: string
          email: string
          expira_em: string | null
          fbclid: string | null
          id: string
          lead_id: string | null
          nome: string
          observacao_atribuicao: string | null
          payment_id: string | null
          payment_provider: string | null
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: string | null
          status_pagamento: string | null
          telefone: string | null
          tipo_venda: string | null
          token_id: string | null
          token_valor: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_id: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_centavos: number | null
        }
        Insert: {
          ad_id?: string | null
          adset_id?: string | null
          cakto_event_id?: string | null
          campaign_id?: string | null
          canal_fechamento?: string | null
          checkout_id?: string | null
          comprado_em?: string | null
          criado_em?: string
          email: string
          expira_em?: string | null
          fbclid?: string | null
          id?: string
          lead_id?: string | null
          nome: string
          observacao_atribuicao?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          plano?: Database["public"]["Enums"]["plano_tipo"] | null
          status?: string | null
          status_pagamento?: string | null
          telefone?: string | null
          tipo_venda?: string | null
          token_id?: string | null
          token_valor?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_centavos?: number | null
        }
        Update: {
          ad_id?: string | null
          adset_id?: string | null
          cakto_event_id?: string | null
          campaign_id?: string | null
          canal_fechamento?: string | null
          checkout_id?: string | null
          comprado_em?: string | null
          criado_em?: string
          email?: string
          expira_em?: string | null
          fbclid?: string | null
          id?: string
          lead_id?: string | null
          nome?: string
          observacao_atribuicao?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          plano?: Database["public"]["Enums"]["plano_tipo"] | null
          status?: string | null
          status_pagamento?: string | null
          telefone?: string | null
          tipo_venda?: string | null
          token_id?: string | null
          token_valor?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_br_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_checkout_br: {
        Row: {
          ad_id: string | null
          adset_id: string | null
          campaign_id: string | null
          checkout_id: string | null
          comprado_em: string | null
          criado_em: string
          email: string
          etapa_funil: string
          expira_em: string | null
          fbclid: string | null
          checkout_url: string | null
          forma_pagamento: string | null
          id: string
          idioma: string | null
          nome: string
          pagamento_mp_id: string | null
          payment_id: string | null
          payment_provider: string | null
          pix_gerado_em: string | null
          plano: Database["public"]["Enums"]["plano_tipo"]
          preference_id: string | null
          origem: string | null
          status: Database["public"]["Enums"]["assinatura_status"]
          telefone: string | null
          token_id: string | null
          token_valor: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_id: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp_enviado_em: string | null
          whatsapp_status: string
          whatsapp_tentativas: number
          checkout_abandono_msg: string | null
          updated_at: string
          valor: number | null
          valor_centavos: number
        }
        Insert: {
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          checkout_id?: string | null
          comprado_em?: string | null
          criado_em?: string
          email: string
          etapa_funil?: string
          expira_em?: string | null
          fbclid?: string | null
          checkout_url?: string | null
          forma_pagamento?: string | null
          id?: string
          idioma?: string | null
          nome: string
          pagamento_mp_id?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          pix_gerado_em?: string | null
          plano: Database["public"]["Enums"]["plano_tipo"]
          preference_id?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["assinatura_status"]
          telefone?: string | null
          token_id?: string | null
          token_valor?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_enviado_em?: string | null
          whatsapp_status?: string
          whatsapp_tentativas?: number
          checkout_abandono_msg?: string | null
          updated_at?: string
          valor?: number | null
          valor_centavos: number
        }
        Update: {
          ad_id?: string | null
          adset_id?: string | null
          campaign_id?: string | null
          checkout_id?: string | null
          comprado_em?: string | null
          criado_em?: string
          email?: string
          etapa_funil?: string
          expira_em?: string | null
          fbclid?: string | null
          checkout_url?: string | null
          forma_pagamento?: string | null
          id?: string
          idioma?: string | null
          nome?: string
          pagamento_mp_id?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          pix_gerado_em?: string | null
          plano?: Database["public"]["Enums"]["plano_tipo"]
          preference_id?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["assinatura_status"]
          telefone?: string | null
          token_id?: string | null
          token_valor?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp_enviado_em?: string | null
          whatsapp_status?: string
          whatsapp_tentativas?: number
          checkout_abandono_msg?: string | null
          updated_at?: string
          valor?: number | null
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
            referencedRelation: "leads_checkout_br"
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
      leads_formulario_sem_checkout: {
        Row: {
          id: string | null
          nome: string | null
          email: string | null
          telefone: string | null
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          criado_em: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      leads_pix_abandonado: {
        Row: {
          id: string | null
          nome: string | null
          email: string | null
          telefone: string | null
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          checkout_id: string | null
          payment_id: string | null
          payment_provider: string | null
          pix_gerado_em: string | null
          criado_em: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      leads_formulario_sem_checkout_whatsapp: {
        Row: {
          id: string | null
          nome: string | null
          email: string | null
          telefone: string | null
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          criado_em: string | null
          updated_at: string | null
          whatsapp_status: string | null
          whatsapp_tentativas: number | null
        }
        Relationships: []
      }
      leads_checkout_iniciado_whatsapp: {
        Row: {
          id: string | null
          nome: string | null
          email: string | null
          telefone: string | null
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          checkout_id: string | null
          payment_id: string | null
          payment_provider: string | null
          checkout_url: string | null
          criado_em: string | null
          updated_at: string | null
          whatsapp_status: string | null
          whatsapp_tentativas: number | null
        }
        Relationships: []
      }
      leads_pix_abandonado_whatsapp: {
        Row: {
          id: string | null
          nome: string | null
          email: string | null
          telefone: string | null
          plano: Database["public"]["Enums"]["plano_tipo"] | null
          status: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          checkout_id: string | null
          payment_id: string | null
          payment_provider: string | null
          pix_gerado_em: string | null
          checkout_url: string | null
          valor: number | null
          forma_pagamento: string | null
          criado_em: string | null
          updated_at: string | null
          whatsapp_status: string | null
          whatsapp_tentativas: number | null
        }
        Relationships: []
      }
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
      assinatura_status:
        | "pendente"
        | "aprovado"
        | "rejeitado"
        | "expirado"
        | "concluida"
        | "recusada"
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
      assinatura_status: [
        "pendente",
        "aprovado",
        "rejeitado",
        "expirado",
        "concluida",
        "recusada",
      ],
      plano_tipo: ["diario", "mensal", "trimestral", "anual"],
      token_status: ["disponivel", "usado"],
    },
  },
} as const
