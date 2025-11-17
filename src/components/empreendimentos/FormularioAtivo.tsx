import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

const ativoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  marca_modelo: z.string().min(1, "Marca/modelo é obrigatório").max(200),
  unidade_id: z.string().min(1, "Unidade é obrigatória"),
  sistema_predial: z.string().optional(),
  data_instalacao: z.string().min(1, "Data de instalação é obrigatória"),
  garantia_meses: z.number().min(0, "Garantia deve ser maior ou igual a 0").max(600),
});

interface FormularioAtivoProps {
  empreendimentoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Unidade {
  id: string;
  numero: string;
  bloco: string | null;
}

interface SistemaPredial {
  sistema: string;
  tipo_garantia: string;
  prazo_anos: number;
}

export const FormularioAtivo = ({ empreendimentoId, onSuccess, onCancel }: FormularioAtivoProps) => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [sistemas, setSistemas] = useState<SistemaPredial[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    marca_modelo: "",
    unidade_id: "",
    sistema_predial: "",
    data_instalacao: "",
    garantia_meses: 12,
  });

  useEffect(() => {
    loadUnidades();
    loadSistemas();
  }, [empreendimentoId]);

  const loadUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select("id, numero, bloco")
        .eq("empreendimento_id", empreendimentoId)
        .order("numero");

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
      toast.error("Erro ao carregar unidades");
    }
  };

  const loadSistemas = async () => {
    try {
      const { data, error } = await supabase
        .from("garantias_nbr_17170")
        .select("sistema, tipo_garantia, prazo_anos")
        .order("sistema");

      if (error) throw error;
      setSistemas(data || []);
    } catch (error) {
      console.error("Erro ao carregar sistemas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar dados
      const validatedData = ativoSchema.parse({
        ...formData,
        sistema_predial: formData.sistema_predial || undefined,
      });

      const { error } = await supabase
        .from("ativos")
        .insert({
          nome: validatedData.nome.trim(),
          marca_modelo: validatedData.marca_modelo.trim(),
          unidade_id: validatedData.unidade_id,
          sistema_predial: validatedData.sistema_predial || null,
          data_instalacao: validatedData.data_instalacao,
          garantia_meses: validatedData.garantia_meses,
        });

      if (error) throw error;

      toast.success("Ativo cadastrado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao cadastrar ativo:", error);
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        toast.error(firstError?.message || "Erro de validação");
      } else {
        toast.error("Erro ao cadastrar ativo");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSistemaChange = (sistema: string) => {
    setFormData(prev => ({ ...prev, sistema_predial: sistema }));
    
    // Atualizar garantia automaticamente baseado no sistema
    const sistemaInfo = sistemas.find(s => s.sistema === sistema);
    if (sistemaInfo) {
      setFormData(prev => ({ 
        ...prev, 
        garantia_meses: sistemaInfo.prazo_anos * 12 
      }));
    }
  };

  if (unidades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Ativo</CardTitle>
          <CardDescription>
            Nenhuma unidade cadastrada neste empreendimento.
            Cadastre unidades primeiro para poder adicionar ativos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onCancel} variant="outline">
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Ativo</CardTitle>
        <CardDescription>
          Cadastre um novo ativo para este empreendimento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Ativo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Ar Condicionado Split"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca_modelo">Marca/Modelo *</Label>
              <Input
                id="marca_modelo"
                value={formData.marca_modelo}
                onChange={(e) => setFormData({ ...formData, marca_modelo: e.target.value })}
                placeholder="Ex: Samsung 12000 BTUs"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade *</Label>
              <Select
                value={formData.unidade_id}
                onValueChange={(value) => setFormData({ ...formData, unidade_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.bloco && `Bloco ${unidade.bloco} - `}Unidade {unidade.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sistema">Sistema Predial (Opcional)</Label>
              <Select
                value={formData.sistema_predial}
                onValueChange={handleSistemaChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent>
                  {sistemas.map((sistema) => (
                    <SelectItem key={sistema.sistema} value={sistema.sistema}>
                      {sistema.sistema} ({sistema.tipo_garantia} - {sistema.prazo_anos} anos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_instalacao">Data de Instalação *</Label>
              <Input
                id="data_instalacao"
                type="date"
                value={formData.data_instalacao}
                onChange={(e) => setFormData({ ...formData, data_instalacao: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="garantia_meses">Garantia (meses) *</Label>
              <Input
                id="garantia_meses"
                type="number"
                min="0"
                max="600"
                value={formData.garantia_meses}
                onChange={(e) => setFormData({ ...formData, garantia_meses: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Ativo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
