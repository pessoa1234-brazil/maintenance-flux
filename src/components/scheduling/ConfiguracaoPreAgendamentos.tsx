import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Settings } from "lucide-react";

interface ConfiguracaoParams {
  anos_antecedencia: number;
  tipos_manutencao: string[];
}

export const ConfiguracaoPreAgendamentos = () => {
  const [config, setConfig] = useState<ConfiguracaoParams>({
    anos_antecedencia: 2,
    tipos_manutencao: ["mensal", "bimestral", "trimestral", "semestral", "anual"]
  });
  const [loading, setLoading] = useState(false);

  const tiposDisponiveis = [
    { id: "mensal", label: "Mensal" },
    { id: "bimestral", label: "Bimestral" },
    { id: "trimestral", label: "Trimestral" },
    { id: "semestral", label: "Semestral" },
    { id: "anual", label: "Anual" }
  ];

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  const carregarConfiguracao = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const stored = localStorage.getItem(`config_pre_agendamentos_${user.id}`);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  };

  const handleSalvar = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      localStorage.setItem(`config_pre_agendamentos_${user.id}`, JSON.stringify(config));
      toast.success("Configuração salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setLoading(false);
    }
  };

  const toggleTipo = (tipo: string) => {
    setConfig(prev => ({
      ...prev,
      tipos_manutencao: prev.tipos_manutencao.includes(tipo)
        ? prev.tipos_manutencao.filter(t => t !== tipo)
        : [...prev.tipos_manutencao, tipo]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Configuração de Pré-Agendamentos</CardTitle>
        </div>
        <CardDescription>
          Configure os parâmetros para geração automática de agendamentos de manutenção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="anos">Anos de antecedência</Label>
          <Input
            id="anos"
            type="number"
            min="1"
            max="10"
            value={config.anos_antecedencia}
            onChange={(e) => setConfig(prev => ({ ...prev, anos_antecedencia: parseInt(e.target.value) || 1 }))}
          />
          <p className="text-sm text-muted-foreground">
            Quantidade de anos à frente para gerar pré-agendamentos (1-10 anos)
          </p>
        </div>

        <div className="space-y-3">
          <Label>Tipos de manutenção a considerar</Label>
          <div className="space-y-2">
            {tiposDisponiveis.map(tipo => (
              <div key={tipo.id} className="flex items-center space-x-2">
                <Checkbox
                  id={tipo.id}
                  checked={config.tipos_manutencao.includes(tipo.id)}
                  onCheckedChange={() => toggleTipo(tipo.id)}
                />
                <label
                  htmlFor={tipo.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {tipo.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSalvar} disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </CardContent>
    </Card>
  );
};
