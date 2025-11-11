import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, Shield, Wrench, Plus, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ordemServicoSchema } from "@/lib/validation";

interface GarantiaNBR {
  id: string;
  sistema: string;
  subsistema: string | null;
  tipo_garantia: string;
  prazo_anos: number;
  descricao: string;
}

interface FormularioOSProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const FormularioOS = ({ onSuccess, onCancel }: FormularioOSProps) => {
  const [loading, setLoading] = useState(false);
  const [garantias, setGarantias] = useState<GarantiaNBR[]>([]);
  const [prazoCalculado, setPrazoCalculado] = useState<number | null>(null);
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([]);
  const [fotosPatologia, setFotosPatologia] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo_servico: "servico_novo",
    sistema_predial: "",
    empreendimento_id: "",
  });

  useEffect(() => {
    carregarGarantias();
    carregarEmpreendimentos();
  }, []);

  useEffect(() => {
    if (formData.tipo_servico === "garantia" && formData.sistema_predial) {
      calcularPrazo();
    } else {
      setPrazoCalculado(null);
    }
  }, [formData.tipo_servico, formData.sistema_predial]);

  const carregarGarantias = async () => {
    try {
      const { data, error } = await supabase
        .from("garantias_nbr_17170")
        .select("*")
        .order("sistema", { ascending: true });

      if (error) throw error;
      setGarantias(data || []);
    } catch (error) {
      console.error("Erro ao carregar garantias:", error);
    }
  };

  const carregarEmpreendimentos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (profile?.empreendimento_id) {
        const { data, error } = await supabase
          .from("empreendimentos")
          .select("id, nome")
          .eq("id", profile.empreendimento_id);

        if (error) throw error;
        setEmpreendimentos(data || []);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, empreendimento_id: data[0].id }));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar empreendimentos:", error);
    }
  };

  const calcularPrazo = async () => {
    try {
      const { data, error } = await supabase.rpc("calcular_prazo_atendimento", {
        p_tipo_servico: formData.tipo_servico as any,
        p_sistema_predial: formData.sistema_predial,
      });

      if (error) throw error;
      setPrazoCalculado(data);
    } catch (error) {
      console.error("Erro ao calcular prazo:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Validate form data
      const validationResult = ordemServicoSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const errors = validationResult.error.format();
        const firstError = Object.values(errors).find((err: any) => err._errors?.length > 0);
        throw new Error((firstError as any)?._errors[0] || "Dados inválidos");
      }

      const validatedData = validationResult.data;

      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id, unidade_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empreendimento_id || !profile?.unidade_id) {
        toast.error("Você precisa estar vinculado a um empreendimento e unidade para criar uma OS");
        return;
      }

      const dataLimite = prazoCalculado
        ? new Date(Date.now() + prazoCalculado * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : null;

      // Upload de fotos de patologia
      let fotosUrls: string[] = [];
      if (fotosPatologia.length > 0) {
        const uploadPromises = fotosPatologia.map(async (foto, index) => {
          const fileExt = foto.name.split('.').pop();
          const fileName = `os-patologia/${user.id}/${Date.now()}_${index}.${fileExt}`;
          const { error: uploadError, data } = await supabase.storage
            .from("empreendimentos")
            .upload(fileName, foto);
          
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("empreendimentos")
            .getPublicUrl(fileName);
          
          return publicUrl;
        });

        fotosUrls = await Promise.all(uploadPromises);
      }

      const { error } = await supabase.from("ordens_servico").insert({
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        tipo_servico: validatedData.tipo_servico as any,
        sistema_predial: validatedData.sistema_predial || null,
        prazo_atendimento_dias: prazoCalculado,
        data_limite_atendimento: dataLimite,
        solicitante_id: user.id,
        unidade_id: profile.unidade_id,
        origem: "SISTEMA" as any,
        status: "A_FAZER" as any,
        fotos_antes: fotosUrls.length > 0 ? fotosUrls : null,
      });

      if (error) throw error;

      toast.success("Ordem de serviço criada com sucesso!");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao criar OS:", error);
      toast.error(error.message || "Erro ao criar ordem de serviço");
    } finally {
      setLoading(false);
    }
  };

  const sistemasUnicos = Array.from(new Set(garantias.map((g) => g.sistema)));
  const garantiaSelecionada = garantias.find((g) => g.sistema === formData.sistema_predial);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Serviço</CardTitle>
          <CardDescription>
            Classifique o tipo de solicitação conforme NBR 17170:2022 e NBR 5674
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className={`cursor-pointer transition-all ${
                formData.tipo_servico === "garantia" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setFormData({ ...formData, tipo_servico: "garantia" })}
            >
              <CardContent className="pt-6 text-center">
                <Shield className={`h-8 w-8 mx-auto mb-2 ${
                  formData.tipo_servico === "garantia" ? "text-primary" : "text-muted-foreground"
                }`} />
                <h3 className="font-semibold mb-1">Garantia</h3>
                <p className="text-xs text-muted-foreground">
                  NBR 17170:2022
                </p>
                <Badge variant="outline" className="mt-2">Prazo obrigatório</Badge>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                formData.tipo_servico === "manutencao_preventiva" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setFormData({ ...formData, tipo_servico: "manutencao_preventiva" })}
            >
              <CardContent className="pt-6 text-center">
                <Wrench className={`h-8 w-8 mx-auto mb-2 ${
                  formData.tipo_servico === "manutencao_preventiva" ? "text-primary" : "text-muted-foreground"
                }`} />
                <h3 className="font-semibold mb-1">Manutenção Preventiva</h3>
                <p className="text-xs text-muted-foreground">
                  NBR 5674
                </p>
                <Badge variant="outline" className="mt-2">Preserva garantia</Badge>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                formData.tipo_servico === "servico_novo" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setFormData({ ...formData, tipo_servico: "servico_novo" })}
            >
              <CardContent className="pt-6 text-center">
                <Plus className={`h-8 w-8 mx-auto mb-2 ${
                  formData.tipo_servico === "servico_novo" ? "text-primary" : "text-muted-foreground"
                }`} />
                <h3 className="font-semibold mb-1">Serviço Novo</h3>
                <p className="text-xs text-muted-foreground">
                  Fora do escopo
                </p>
                <Badge variant="outline" className="mt-2">Sem prazo</Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {(formData.tipo_servico === "garantia" || formData.tipo_servico === "manutencao_preventiva") && (
        <Card>
          <CardHeader>
            <CardTitle>Sistema Predial</CardTitle>
            <CardDescription>Selecione o sistema relacionado ao problema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sistema">Sistema *</Label>
              <Select
                value={formData.sistema_predial}
                onValueChange={(value) => setFormData({ ...formData, sistema_predial: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent>
                  {sistemasUnicos.map((sistema) => (
                    <SelectItem key={sistema} value={sistema}>
                      {sistema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {garantiaSelecionada && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">
                    {garantiaSelecionada.tipo_garantia === "legal" ? "Garantia Legal" : "Garantia Oferecida"}
                  </p>
                  <p className="text-sm">{garantiaSelecionada.descricao}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary">
                      Prazo: {garantiaSelecionada.prazo_anos} anos
                    </Badge>
                    {prazoCalculado && (
                      <Badge variant="destructive">
                        Atendimento: {prazoCalculado} dias
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Solicitação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {empreendimentos.length > 0 && (
            <div>
              <Label htmlFor="empreendimento">Empreendimento *</Label>
              <Select
                value={formData.empreendimento_id}
                onValueChange={(value) => setFormData({ ...formData, empreendimento_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o empreendimento" />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Vazamento no banheiro"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição Detalhada *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o problema com o máximo de detalhes possível"
              rows={5}
              required
            />
          </div>

          <div>
            <Label htmlFor="fotos_patologia">Fotos da Patologia</Label>
            <div className="space-y-2">
              <Label htmlFor="fotos_patologia" className="cursor-pointer">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para adicionar fotos da patologia
                  </p>
                </div>
              </Label>
              <Input
                id="fotos_patologia"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    setFotosPatologia(prev => [...prev, ...newFiles]);
                  }
                }}
                className="hidden"
              />
              
              {fotosPatologia.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {fotosPatologia.map((foto, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(foto)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setFotosPatologia(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar Ordem de Serviço"}
        </Button>
      </div>
    </form>
  );
};
