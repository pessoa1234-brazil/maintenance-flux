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
      agendamentos: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          os_id: string | null
          prestador_id: string
          solicitante_id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          os_id?: string | null
          prestador_id: string
          solicitante_id: string
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          os_id?: string | null
          prestador_id?: string
          solicitante_id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_contrato: {
        Row: {
          assinante_id: string
          assinatura_hash: string
          contrato_id: string
          created_at: string
          id: string
          ip_address: string
          tipo_assinante: string
          user_agent: string | null
        }
        Insert: {
          assinante_id: string
          assinatura_hash: string
          contrato_id: string
          created_at?: string
          id?: string
          ip_address: string
          tipo_assinante: string
          user_agent?: string | null
        }
        Update: {
          assinante_id?: string
          assinatura_hash?: string
          contrato_id?: string
          created_at?: string
          id?: string
          ip_address?: string
          tipo_assinante?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_contrato_assinante_id_fkey"
            columns: ["assinante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_contrato_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
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
      avaliacoes: {
        Row: {
          avaliador_id: string
          comentario: string | null
          created_at: string
          id: string
          nota: number
          os_id: string
          prestador_id: string
          updated_at: string
        }
        Insert: {
          avaliador_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          os_id: string
          prestador_id: string
          updated_at?: string
        }
        Update: {
          avaliador_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          os_id?: string
          prestador_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
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
      contratos: {
        Row: {
          assinatura_prestador_data: string | null
          assinatura_prestador_ip: string | null
          assinatura_solicitante_data: string | null
          assinatura_solicitante_ip: string | null
          created_at: string
          descricao: string
          id: string
          os_id: string | null
          prazo_dias: number
          prestador_id: string
          solicitante_id: string
          status: string
          termos_condicoes: string
          titulo: string
          updated_at: string
          valor: number
        }
        Insert: {
          assinatura_prestador_data?: string | null
          assinatura_prestador_ip?: string | null
          assinatura_solicitante_data?: string | null
          assinatura_solicitante_ip?: string | null
          created_at?: string
          descricao: string
          id?: string
          os_id?: string | null
          prazo_dias: number
          prestador_id: string
          solicitante_id: string
          status?: string
          termos_condicoes: string
          titulo: string
          updated_at?: string
          valor: number
        }
        Update: {
          assinatura_prestador_data?: string | null
          assinatura_prestador_ip?: string | null
          assinatura_solicitante_data?: string | null
          assinatura_solicitante_ip?: string | null
          created_at?: string
          descricao?: string
          id?: string
          os_id?: string | null
          prazo_dias?: number
          prestador_id?: string
          solicitante_id?: string
          status?: string
          termos_condicoes?: string
          titulo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      garantias_nbr_17170: {
        Row: {
          created_at: string | null
          descricao: string | null
          exemplos_falhas: string | null
          id: string
          prazo_anos: number
          sistema: string
          subsistema: string | null
          tipo_garantia: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          exemplos_falhas?: string | null
          id?: string
          prazo_anos: number
          sistema: string
          subsistema?: string | null
          tipo_garantia: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          exemplos_falhas?: string | null
          id?: string
          prazo_anos?: number
          sistema?: string
          subsistema?: string | null
          tipo_garantia?: string
        }
        Relationships: []
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
      mensagens_chat: {
        Row: {
          created_at: string
          destinatario_id: string
          id: string
          lida: boolean
          mensagem: string
          os_id: string
          remetente_id: string
        }
        Insert: {
          created_at?: string
          destinatario_id: string
          id?: string
          lida?: boolean
          mensagem: string
          os_id: string
          remetente_id: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string
          id?: string
          lida?: boolean
          mensagem?: string
          os_id?: string
          remetente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_chat_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
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
          data_limite_atendimento: string | null
          data_solicitacao: string
          descricao: string | null
          descricao_trabalho_realizado: string | null
          fotos_antes: string[] | null
          fotos_depois: string[] | null
          id: string
          materiais_utilizados: string | null
          origem: Database["public"]["Enums"]["origem_os"]
          prazo_atendimento_dias: number | null
          prestador_id: string | null
          sistema_predial: string | null
          solicitante_id: string
          status: Database["public"]["Enums"]["status_os"]
          tempo_conclusao_dias: number | null
          tempo_resposta_horas: number | null
          tipo_servico: Database["public"]["Enums"]["tipo_servico"] | null
          titulo: string
          unidade_id: string
          updated_at: string
          valor_final: number | null
        }
        Insert: {
          ativo_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_limite_atendimento?: string | null
          data_solicitacao?: string
          descricao?: string | null
          descricao_trabalho_realizado?: string | null
          fotos_antes?: string[] | null
          fotos_depois?: string[] | null
          id?: string
          materiais_utilizados?: string | null
          origem: Database["public"]["Enums"]["origem_os"]
          prazo_atendimento_dias?: number | null
          prestador_id?: string | null
          sistema_predial?: string | null
          solicitante_id: string
          status?: Database["public"]["Enums"]["status_os"]
          tempo_conclusao_dias?: number | null
          tempo_resposta_horas?: number | null
          tipo_servico?: Database["public"]["Enums"]["tipo_servico"] | null
          titulo: string
          unidade_id: string
          updated_at?: string
          valor_final?: number | null
        }
        Update: {
          ativo_id?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_limite_atendimento?: string | null
          data_solicitacao?: string
          descricao?: string | null
          descricao_trabalho_realizado?: string | null
          fotos_antes?: string[] | null
          fotos_depois?: string[] | null
          id?: string
          materiais_utilizados?: string | null
          origem?: Database["public"]["Enums"]["origem_os"]
          prazo_atendimento_dias?: number | null
          prestador_id?: string | null
          sistema_predial?: string | null
          solicitante_id?: string
          status?: Database["public"]["Enums"]["status_os"]
          tempo_conclusao_dias?: number | null
          tempo_resposta_horas?: number | null
          tipo_servico?: Database["public"]["Enums"]["tipo_servico"] | null
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
      pagamentos: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_pagamento: string | null
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          os_id: string
          status: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          os_id: string
          status?: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          os_id?: string
          status?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
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
          nota_media: number | null
          phone: string | null
          total_avaliacoes: number | null
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
          nota_media?: number | null
          phone?: string | null
          total_avaliacoes?: number | null
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
          nota_media?: number | null
          phone?: string | null
          total_avaliacoes?: number | null
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
      relatorios_conformidade: {
        Row: {
          created_at: string | null
          empreendimento_id: string
          garantias_preservadas: boolean | null
          gerado_por: string | null
          id: string
          manutencoes_pendentes: number | null
          manutencoes_realizadas: number | null
          observacoes: string | null
          periodo_fim: string
          periodo_inicio: string
        }
        Insert: {
          created_at?: string | null
          empreendimento_id: string
          garantias_preservadas?: boolean | null
          gerado_por?: string | null
          id?: string
          manutencoes_pendentes?: number | null
          manutencoes_realizadas?: number | null
          observacoes?: string | null
          periodo_fim: string
          periodo_inicio: string
        }
        Update: {
          created_at?: string | null
          empreendimento_id?: string
          garantias_preservadas?: boolean | null
          gerado_por?: string | null
          id?: string
          manutencoes_pendentes?: number | null
          manutencoes_realizadas?: number | null
          observacoes?: string | null
          periodo_fim?: string
          periodo_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_conformidade_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_configuracao: {
        Row: {
          alerta_percentual: number
          created_at: string
          empreendimento_id: string | null
          id: string
          prazo_conclusao_dias: number
          prazo_resposta_horas: number
          sistema_predial: string | null
          tipo_servico: Database["public"]["Enums"]["tipo_servico"]
        }
        Insert: {
          alerta_percentual?: number
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          prazo_conclusao_dias: number
          prazo_resposta_horas: number
          sistema_predial?: string | null
          tipo_servico: Database["public"]["Enums"]["tipo_servico"]
        }
        Update: {
          alerta_percentual?: number
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          prazo_conclusao_dias?: number
          prazo_resposta_horas?: number
          sistema_predial?: string | null
          tipo_servico?: Database["public"]["Enums"]["tipo_servico"]
        }
        Relationships: [
          {
            foreignKeyName: "sla_configuracao_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
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
      calcular_prazo_atendimento: {
        Args: {
          p_sistema_predial: string
          p_tipo_servico: Database["public"]["Enums"]["tipo_servico"]
        }
        Returns: number
      }
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
      tipo_servico: "garantia" | "manutencao_preventiva" | "servico_novo"
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
      tipo_servico: ["garantia", "manutencao_preventiva", "servico_novo"],
    },
  },
} as const
