import { z } from "zod";

// Empreendimento validation schema
export const empreendimentoSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(200, "Nome deve ter no máximo 200 caracteres"),
  endereco: z.string().trim().min(5, "Endereço deve ter no mínimo 5 caracteres").max(300, "Endereço deve ter no máximo 300 caracteres"),
  cidade: z.string().trim().min(2, "Cidade deve ter no mínimo 2 caracteres").max(100, "Cidade deve ter no máximo 100 caracteres"),
  estado: z.string().trim().length(2, "Estado deve ter 2 caracteres (ex: SP)").toUpperCase(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido (formato: 12345-678)"),
  area_terreno: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().positive("Área deve ser positiva").max(1000000, "Área máxima: 1.000.000 m²").optional()
  ),
  numero_andares: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().int("Número de andares deve ser inteiro").positive("Número de andares deve ser positivo").max(300, "Máximo: 300 andares").optional()
  ),
  numero_elevadores: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().int("Número de elevadores deve ser inteiro").nonnegative("Número de elevadores deve ser positivo ou zero").max(50, "Máximo: 50 elevadores").optional()
  ),
  numero_apartamentos: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().int("Número de apartamentos deve ser inteiro").nonnegative("Número de apartamentos deve ser positivo ou zero").max(5000, "Máximo: 5000 apartamentos").optional()
  ),
  area_media_apartamentos: z.preprocess(
    (val) => (val === "" || val === null ? undefined : Number(val)),
    z.number().positive("Área média deve ser positiva").max(10000, "Área máxima: 10.000 m²").optional()
  ),
  total_unidades: z.preprocess(
    (val) => (val === "" ? "0" : val),
    z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0 || num > 10000) {
        throw new Error("Total de unidades deve estar entre 0 e 10.000");
      }
      return num;
    })
  ),
  data_entrega: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  data_habite_se: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").or(z.literal("")),
});

export type EmpreendimentoFormData = z.infer<typeof empreendimentoSchema>;

// Ordem de Serviço validation schema
export const ordemServicoSchema = z.object({
  titulo: z.string().trim().min(5, "Título deve ter no mínimo 5 caracteres").max(200, "Título deve ter no máximo 200 caracteres"),
  descricao: z.string().trim().min(10, "Descrição deve ter no mínimo 10 caracteres").max(2000, "Descrição deve ter no máximo 2000 caracteres"),
  tipo_servico: z.enum(["garantia", "manutencao_preventiva", "servico_novo"], {
    errorMap: () => ({ message: "Tipo de serviço inválido" }),
  }),
  sistema_predial: z.string().max(200, "Sistema predial deve ter no máximo 200 caracteres").optional(),
});

export type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>;
