export interface Usuario {
  id: string;
  nome: string;
  nota: number;
}

export interface Documento {
  id: string;
  nome: string;
  url: string;
  tipo: "NOTA_FISCAL" | "MANUAL_TECNICO" | "OUTRO";
}

export interface Ativo {
  id: string;
  nome: string;
  marcaModelo: string;
  dataInstalacao: string;
  garantiaMeses: number;
  documentos: Documento[];
  sistema_predial?: string;
}

export type StatusOS = "A_FAZER" | "PENDENTE_ORCAMENTO" | "EM_ANDAMENTO" | "CONCLUIDA";

export interface OrdemServico {
  id: string;
  titulo: string;
  status: StatusOS;
  tecnicoId: string | null;
  ativoId?: string;
}

export type StatusOrcamento = "PENDENTE" | "ACEITO" | "RECUSADO";

export interface Orcamento {
  id: string;
  osId: string;
  prestadorId: string;
  valor: number;
  descricao: string;
  status: StatusOrcamento;
}

export type TipoItemChecklist = "CHECKBOX" | "TEXTO" | "FOTO";

export interface ItemChecklist {
  id: string;
  texto: string;
  tipo: TipoItemChecklist;
  obrigatorio: boolean;
  preenchido: boolean;
  respostaBool?: boolean;
  respostaTexto?: string;
  respostaUrl?: string;
}

export interface Checklist {
  id: string;
  osId: string;
  itens: ItemChecklist[];
}

export interface Database {
  usuarios: Record<string, Usuario>;
  ativos: Record<string, Ativo>;
  ordensServico: Record<string, OrdemServico>;
  orcamentos: Record<string, Orcamento>;
  checklists: Record<string, Checklist>;
}
