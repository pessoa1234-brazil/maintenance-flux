import { Database } from "@/types";

export const initialDatabase: Database = {
  usuarios: {
    u1: { id: "u1", nome: "Serralheria Ágil", nota: 4.9 },
    u2: { id: "u2", nome: "Portão & Cia", nota: 4.7 },
    u3: { id: "u3", nome: "Max Reparos", nota: 4.5 },
  },
  ativos: {
    a1: {
      id: "a1",
      nome: "Bomba Subsolo 1",
      marcaModelo: "Schneider X-100",
      dataInstalacao: "2024-01-15T10:00:00Z",
      garantiaMeses: 12,
      documentos: [
        { id: "d1", nome: "Nota Fiscal", url: "#", tipo: "NOTA_FISCAL" },
        { id: "d2", nome: "Manual Técnico", url: "#", tipo: "MANUAL_TECNICO" },
      ],
    },
    a2: {
      id: "a2",
      nome: "Portão Garagem P2",
      marcaModelo: "Garen Fast-100",
      dataInstalacao: "2022-05-10T10:00:00Z",
      garantiaMeses: 24,
      documentos: [{ id: "d3", nome: "Nota Fiscal", url: "#", tipo: "NOTA_FISCAL" }],
    },
  },
  ordensServico: {
    os101: { id: "os101", titulo: "Manutenção Preventiva - Bombas", status: "A_FAZER", tecnicoId: null },
    os102: { id: "os102", titulo: "Revisão Elevador Social", status: "EM_ANDAMENTO", tecnicoId: "u2" },
    os103: { id: "os103", titulo: "Limpeza Caixa D'água", status: "CONCLUIDA", tecnicoId: "u3" },
    os104: {
      id: "os104",
      titulo: "Conserto Portão Garagem P2",
      status: "PENDENTE_ORCAMENTO",
      tecnicoId: null,
      ativoId: "a2",
    },
  },
  orcamentos: {
    orc1: {
      id: "orc1",
      osId: "os104",
      prestadorId: "u1",
      valor: 450.0,
      descricao: "Troca de rolamentos e mão de obra.",
      status: "PENDENTE",
    },
    orc2: {
      id: "orc2",
      osId: "os104",
      prestadorId: "u2",
      valor: 480.0,
      descricao: "Troca de rolamentos e ajuste do motor.",
      status: "PENDENTE",
    },
    orc3: {
      id: "orc3",
      osId: "os104",
      prestadorId: "u3",
      valor: 430.0,
      descricao: "Ajuste fino.",
      status: "PENDENTE",
    },
  },
  checklists: {
    chk104: {
      id: "chk104",
      osId: "os104",
      itens: [
        {
          id: "item1",
          texto: "Verificar alinhamento do portão",
          tipo: "CHECKBOX",
          obrigatorio: true,
          preenchido: false,
          respostaBool: false,
        },
        {
          id: "item2",
          texto: "Anexar foto do 'antes'",
          tipo: "FOTO",
          obrigatorio: true,
          preenchido: false,
          respostaUrl: undefined,
        },
        {
          id: "item3",
          texto: "Anexar foto do 'depois'",
          tipo: "FOTO",
          obrigatorio: true,
          preenchido: false,
          respostaUrl: undefined,
        },
        {
          id: "item4",
          texto: "Observações do reparo",
          tipo: "TEXTO",
          obrigatorio: false,
          preenchido: false,
          respostaTexto: "",
        },
      ],
    },
  },
};
