import * as z from "zod";

// Empreendimento validation schema
export const empreendimentoSchema = z.object({
  nome: z.string().min(3).max(200),
  endereco: z.string().min(5).max(300),
  cidade: z.string().min(2).max(100),
  estado: z.string().length(2),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  area_terreno: z.number().positive().max(1000000).optional(),
  numero_andares: z.number().int().positive().max(300).optional(),
  numero_elevadores: z.number().int().nonnegative().max(50).optional(),
  numero_apartamentos: z.number().int().nonnegative().max(5000).optional(),
  area_media_apartamentos: z.number().positive().max(10000).optional(),
  total_unidades: z.number().int().nonnegative().max(10000),
  data_entrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_habite_se: z.string().optional(),
});

// Ordem de Serviço validation schema
export const ordemServicoSchema = z.object({
  titulo: z.string().min(5).max(200),
  descricao: z.string().min(10).max(2000),
  tipo_servico: z.enum(["garantia", "manutencao_preventiva", "servico_novo"]),
  sistema_predial: z.string().max(200).optional(),
});
