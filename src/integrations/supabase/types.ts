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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ativos: {
        Row: {
          created_at: string
          data_instalacao: string
          garantia_meses: number
          id: string
          marca_modelo: string
          nome: string
          unidade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_instalacao: string
          garantia_meses: number
          id?: string
          marca_modelo: string
          nome: string
          unidade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_instalacao?: string
          garantia_meses?: number
          id?: string
          marca_modelo?: string
          nome?: string
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ativos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ativos_documentos: {
        Row: {
          ativo_id: string
          documento_id: string
        }
        Insert: {
          ativo_id: string
          documento_id: string
        }
        Update: {
          ativo_id?: string
          documento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ativos_documentos_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ativos_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          id: string
          os_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          os_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          os_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: true
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_documento"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["tipo_documento"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          url?: string
        }
        Relationships: []
      }
      empreendimentos: {
        Row: {
          area_media_apartamentos: number | null
          area_terreno: number | null
          cep: string
          cidade: string
          construtora_id: string
          created_at: string
          data_entrega: string
          data_habite_se: string | null
          endereco: string
          estado: string
          id: string
          manual_condominio: string | null
          manual_proprietario: string | null
          manual_usuario: string | null
          nome: string
          numero_andares: number | null
          numero_apartamentos: number | null
          numero_elevadores: number | null
          total_unidades: number
          updated_at: string
        }
        Insert: {
          area_media_apartamentos?: number | null
          area_terreno?: number | null
          cep: string
          cidade: string
          construtora_id: string
          created_at?: string
          data_entrega: string
          data_habite_se?: string | null
          endereco: string
          estado: string
          id?: string
          manual_condominio?: string | null
          manual_proprietario?: string | null
          manual_usuario?: string | null
          nome: string
          numero_andares?: number | null
          numero_apartamentos?: number | null
          numero_elevadores?: number | null
          total_unidades?: number
          updated_at?: string
        }
        Update: {
          area_media_apartamentos?: number | null
          area_terreno?: number | null
          cep?: string
          cidade?: string
          construtora_id?: string
          created_at?: string
          data_entrega?: string
          data_habite_se?: string | null
          endereco?: string
          estado?: string
          id?: string
          manual_condominio?: string | null
          manual_proprietario?: string | null
          manual_usuario?: string | null
          nome?: string
          numero_andares?: number | null
          numero_apartamentos?: number | null
          numero_elevadores?: number | null
          total_unidades?: number
          updated_at?: string
        }
        Relationships: []
      }
      especificacoes_tecnicas: {
        Row: {
          categoria: string
          created_at: string | null
          empreendimento_id: string
          especificacao: string
          fonte: string | null
          id: string
          item: string
          pagina: number | null
          updated_at: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          empreendimento_id: string
          especificacao: string
          fonte?: string | null
          id?: string
          item: string
          pagina?: number | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          empreendimento_id?: string
          especificacao?: string
          fonte?: string | null
          id?: string
          item?: string
          pagina?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "especificacoes_tecnicas_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_checklist: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          obrigatorio: boolean
          ordem: number
          preenchido: boolean
          resposta_bool: boolean | null
          resposta_texto: string | null
          resposta_url: string | null
          texto: string
          tipo: Database["public"]["Enums"]["tipo_item_checklist"]
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          obrigatorio?: boolean
          ordem?: number
          preenchido?: boolean
          resposta_bool?: boolean | null
          resposta_texto?: string | null
          resposta_url?: string | null
          texto: string
          tipo: Database["public"]["Enums"]["tipo_item_checklist"]
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          obrigatorio?: boolean
          ordem?: number
          preenchido?: boolean
          resposta_bool?: boolean | null
          resposta_texto?: string | null
          resposta_url?: string | null
          texto?: string
          tipo?: Database["public"]["Enums"]["tipo_item_checklist"]
        }
        Relationships: [
          {
            foreignKeyName: "itens_checklist_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          created_at: string
          descricao: string
          id: string
          os_id: string
          prazo_dias: number | null
          prestador_id: string
          status: Database["public"]["Enums"]["status_orcamento"]
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          os_id: string
          prazo_dias?: number | null
          prestador_id: string
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          os_id?: string
          prazo_dias?: number | null
          prestador_id?: string
          status?: Database["public"]["Enums"]["status_orcamento"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          ativo_id: string | null
          created_at: string
          data_conclusao: string | null
          data_solicitacao: string
          descricao: string | null
          id: string
          origem: Database["public"]["Enums"]["origem_os"]
          prestador_id: string | null
          solicitante_id: string
          status: Database["public"]["Enums"]["status_os"]
          titulo: string
          unidade_id: string
          updated_at: string
          valor_final: number | null
        }
        Insert: {
          ativo_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_solicitacao?: string
          descricao?: string | null
          id?: string
          origem: Database["public"]["Enums"]["origem_os"]
          prestador_id?: string | null
          solicitante_id: string
          status?: Database["public"]["Enums"]["status_os"]
          titulo: string
          unidade_id: string
          updated_at?: string
          valor_final?: number | null
        }
        Update: {
          ativo_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_solicitacao?: string
          descricao?: string | null
          id?: string
          origem?: Database["public"]["Enums"]["origem_os"]
          prestador_id?: string | null
          solicitante_id?: string
          status?: Database["public"]["Enums"]["status_os"]
          titulo?: string
          unidade_id?: string
          updated_at?: string
          valor_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_ativo_id_fkey"
            columns: ["ativo_id"]
            isOneToOne: false
            referencedRelation: "ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          document: string | null
          email: string
          empreendimento_id: string | null
          full_name: string
          id: string
          phone: string | null
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          document?: string | null
          email: string
          empreendimento_id?: string | null
          full_name: string
          id: string
          phone?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          document?: string | null
          email?: string
          empreendimento_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          bloco: string | null
          condominio_id: string | null
          created_at: string
          empreendimento_id: string
          id: string
          numero: string
          updated_at: string
        }
        Insert: {
          bloco?: string | null
          condominio_id?: string | null
          created_at?: string
          empreendimento_id: string
          id?: string
          numero: string
          updated_at?: string
        }
        Update: {
          bloco?: string | null
          condominio_id?: string | null
          created_at?: string
          empreendimento_id?: string
          id?: string
          numero?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
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
      app_role: "admin" | "construtora" | "condominio" | "prestador" | "cliente"
      origem_os: "GARANTIA" | "MANUTENCAO_PREVENTIVA" | "MANUTENCAO_CORRETIVA"
      status_orcamento: "PENDENTE" | "ACEITO" | "RECUSADO"
      status_os:
        | "A_FAZER"
        | "PENDENTE_ORCAMENTO"
        | "EM_ANDAMENTO"
        | "CONCLUIDA"
        | "CANCELADA"
      tipo_documento:
        | "NOTA_FISCAL"
        | "MANUAL_TECNICO"
        | "LAUDO"
        | "FOTO"
        | "OUTRO"
      tipo_item_checklist: "CHECKBOX" | "TEXTO" | "FOTO"
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
      app_role: ["admin", "construtora", "condominio", "prestador", "cliente"],
      origem_os: ["GARANTIA", "MANUTENCAO_PREVENTIVA", "MANUTENCAO_CORRETIVA"],
      status_orcamento: ["PENDENTE", "ACEITO", "RECUSADO"],
      status_os: [
        "A_FAZER",
        "PENDENTE_ORCAMENTO",
        "EM_ANDAMENTO",
        "CONCLUIDA",
        "CANCELADA",
      ],
      tipo_documento: [
        "NOTA_FISCAL",
        "MANUAL_TECNICO",
        "LAUDO",
        "FOTO",
        "OUTRO",
      ],
      tipo_item_checklist: ["CHECKBOX", "TEXTO", "FOTO"],
    },
  },
} as const
