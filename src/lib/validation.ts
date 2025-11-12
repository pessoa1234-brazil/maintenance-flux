import * as z from "zod";

// Empreendimento validation schema
// Base schema for all empreendimentos
const baseEmpreendimentoSchema = z.object({
  nome: z.string()
    .min(3, { message: "Nome: deve ter no mínimo 3 caracteres" })
    .max(200, { message: "Nome: deve ter no máximo 200 caracteres" }),
  endereco: z.string()
    .min(5, { message: "Endereço: deve ter no mínimo 5 caracteres" })
    .max(300, { message: "Endereço: deve ter no máximo 300 caracteres" }),
  cidade: z.string()
    .min(2, { message: "Cidade: deve ter no mínimo 2 caracteres" })
    .max(100, { message: "Cidade: deve ter no máximo 100 caracteres" }),
  estado: z.string()
    .length(2, { message: "Estado: deve ter exatamente 2 caracteres (sigla UF)" }),
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, { message: "CEP: formato inválido (use 00000-000)" }),
  tipo_empreendimento: z.enum(["condominio", "nao_condominio"]),
  area_terreno: z.coerce.number()
    .positive({ message: "Área do terreno: deve ser maior que zero" })
    .max(1000000, { message: "Área do terreno: deve ser no máximo 1.000.000 m²" })
    .optional(),
  total_unidades: z.coerce.number()
    .int({ message: "Total de unidades: deve ser um número inteiro" })
    .nonnegative({ message: "Total de unidades: não pode ser negativo" })
    .max(10000, { message: "Total de unidades: deve ser no máximo 10.000" }),
  data_entrega: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data de entrega: formato inválido (use AAAA-MM-DD)" }),
  data_habite_se: z.string().optional(),
});

// Condominium-specific fields
const condominioFields = z.object({
  numero_andares: z.coerce.number()
    .int({ message: "Número de andares: deve ser um número inteiro" })
    .positive({ message: "Número de andares: deve ser maior que zero" })
    .max(300, { message: "Número de andares: deve ser no máximo 300" })
    .optional(),
  numero_elevadores: z.coerce.number()
    .int({ message: "Número de elevadores: deve ser um número inteiro" })
    .nonnegative({ message: "Número de elevadores: não pode ser negativo" })
    .max(50, { message: "Número de elevadores: deve ser no máximo 50" })
    .optional(),
  numero_apartamentos: z.coerce.number()
    .int({ message: "Número de apartamentos: deve ser um número inteiro" })
    .nonnegative({ message: "Número de apartamentos: não pode ser negativo" })
    .max(5000, { message: "Número de apartamentos: deve ser no máximo 5.000" })
    .optional(),
  area_media_apartamentos: z.coerce.number()
    .positive({ message: "Área média dos apartamentos: deve ser maior que zero" })
    .max(10000, { message: "Área média dos apartamentos: deve ser no máximo 10.000 m²" })
    .optional(),
});

// Export unified schema - validates conditionally based on tipo_empreendimento
export const empreendimentoSchema = baseEmpreendimentoSchema.merge(condominioFields);

// Ordem de Serviço validation schema
export const ordemServicoSchema = z.object({
  titulo: z.string().min(5).max(200),
  descricao: z.string().min(10).max(2000),
  tipo_servico: z.enum(["garantia", "manutencao_preventiva", "servico_novo"]),
  sistema_predial: z.string().max(200).optional(),
});
