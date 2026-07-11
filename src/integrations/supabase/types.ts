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
          atualizado_em: string
          campanha: string | null
          checkout_id: string | null
          checkout_iniciado_em: string | null
          checkout_url: string | null
          comprado_em: string | null
          criado_em: string
          criativo: string | null
          email: string
          erro_processamento: string | null
          etapa_funil: string
          external_reference: string | null
          forma_pagamento: string | null
          id: string
          nome: string
          observacao_recuperacao: string | null
          observacoes: string | null
          origem: string | null
          payment_id: string | null
          payment_provider: string | null
          pix_gerado_em: string | null
          plano: Database["public"]["Enums"]["plano_tipo"]
          quantidade_contatos: number
          reembolsado_em: string | null
          recusado_em: string | null
          respondeu_whatsapp: boolean | null
          status_pagamento: Database["public"]["Enums"]["assinatura_status"]
          status_recuperacao: string | null
          telefone: string | null
          ultima_recuperacao_em: string | null
          ultimo_evento_webhook: string | null
          ultimo_webhook_em: string | null
          whatsapp_status: string
          whatsapp_opt_out: boolean
          whatsapp_ultimo_erro: string | null
          valor_oferta: number | null
          valor_pago: number | null
        }
        Insert: {
          atualizado_em?: string
          campanha?: string | null
          checkout_id?: string | null
          checkout_iniciado_em?: string | null
          checkout_url?: string | null
          comprado_em?: string | null
          criado_em?: string
          criativo?: string | null
          email: string
          erro_processamento?: string | null
          etapa_funil?: string
          external_reference?: string | null
          forma_pagamento?: string | null
          id?: string
          nome: string
          observacao_recuperacao?: string | null
          observacoes?: string | null
          origem?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          pix_gerado_em?: string | null
          plano: Database["public"]["Enums"]["plano_tipo"]
          quantidade_contatos?: number
          reembolsado_em?: string | null
          recusado_em?: string | null
          respondeu_whatsapp?: boolean | null
          status_pagamento?: Database["public"]["Enums"]["assinatura_status"]
          status_recuperacao?: string | null
          telefone?: string | null
          ultima_recuperacao_em?: string | null
          ultimo_evento_webhook?: string | null
          ultimo_webhook_em?: string | null
          whatsapp_status?: string
          whatsapp_opt_out?: boolean
          whatsapp_ultimo_erro?: string | null
          valor_oferta?: number | null
          valor_pago?: number | null
        }
        Update: {
          atualizado_em?: string
          campanha?: string | null
          checkout_id?: string | null
          checkout_iniciado_em?: string | null
          checkout_url?: string | null
          comprado_em?: string | null
          criado_em?: string
          criativo?: string | null
          email?: string
          erro_processamento?: string | null
          etapa_funil?: string
          external_reference?: string | null
          forma_pagamento?: string | null
          id?: string
          nome?: string
          observacao_recuperacao?: string | null
          observacoes?: string | null
          origem?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          pix_gerado_em?: string | null
          plano?: Database["public"]["Enums"]["plano_tipo"]
          quantidade_contatos?: number
          reembolsado_em?: string | null
          recusado_em?: string | null
          respondeu_whatsapp?: boolean | null
          status_pagamento?: Database["public"]["Enums"]["assinatura_status"]
          status_recuperacao?: string | null
          telefone?: string | null
          ultima_recuperacao_em?: string | null
          ultimo_evento_webhook?: string | null
          ultimo_webhook_em?: string | null
          whatsapp_status?: string
          whatsapp_opt_out?: boolean
          whatsapp_ultimo_erro?: string | null
          valor_oferta?: number | null
          valor_pago?: number | null
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
          status_pagamento: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          criado_em: string | null
          atualizado_em: string | null
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
          status_pagamento: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          checkout_id: string | null
          payment_id: string | null
          payment_provider: string | null
          pix_gerado_em: string | null
          criado_em: string | null
          atualizado_em: string | null
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
          status_pagamento: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          criado_em: string | null
          atualizado_em: string | null
          whatsapp_status: string | null
          quantidade_contatos: number | null
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
          status_pagamento: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          checkout_id: string | null
          payment_id: string | null
          payment_provider: string | null
          checkout_url: string | null
          criado_em: string | null
          atualizado_em: string | null
          whatsapp_status: string | null
          quantidade_contatos: number | null
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
          status_pagamento: Database["public"]["Enums"]["assinatura_status"] | null
          etapa_funil: string | null
          checkout_id: string | null
          payment_id: string | null
          payment_provider: string | null
          pix_gerado_em: string | null
          checkout_url: string | null
          valor_oferta: number | null
          forma_pagamento: string | null
          criado_em: string | null
          atualizado_em: string | null
          whatsapp_status: string | null
          quantidade_contatos: number | null
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
        | "reprovado"
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
        "reprovado",
      ],
      plano_tipo: ["diario", "mensal", "trimestral", "anual"],
      token_status: ["disponivel", "usado"],
    },
  },
} as const
