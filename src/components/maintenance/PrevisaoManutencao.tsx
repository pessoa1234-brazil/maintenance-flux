import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PrevisaoManutencao() {
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [loading, setLoading] = useState(false);
  const [previsao, setPrevisao] = useState<any>(null);

  useState(() => {
    loadEmpreendimentos();
  });

  const loadEmpreendimentos = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empreendimento_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile?.empreendimento_id) {
        const { data } = await supabase
          .from('empreendimentos')
          .select('*')
          .eq('id', profile.empreendimento_id);
        
        if (data) setEmpreendimentos(data);
      } else {
        const { data } = await supabase
          .from('empreendimentos')
          .select('*')
          .limit(50);
        
        if (data) setEmpreendimentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar empreendimentos:', error);
    }
  };

  const gerarPrevisao = async () => {
    if (!selectedEmp) {
      toast.error("Selecione um empreendimento");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('previsao-manutencao', {
        body: { empreendimentoId: selectedEmp }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Limite de requisições')) {
          toast.error("Limite de requisições excedido. Aguarde alguns instantes.");
        } else if (data.error.includes('Créditos insuficientes')) {
          toast.error("Créditos insuficientes. Configure o Lovable AI.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setPrevisao(data);
      toast.success("Previsão gerada com sucesso!");
    } catch (error: any) {
      console.error('Erro ao gerar previsão:', error);
      toast.error(error.message || "Erro ao gerar previsão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Previsão de Manutenção</h2>
        <p className="text-muted-foreground">
          Análise preditiva usando inteligência artificial para antecipar necessidades de manutenção
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configuração da Análise
          </CardTitle>
          <CardDescription>
            Selecione o empreendimento para análise do histórico de manutenção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empreendimento</label>
            <Select value={selectedEmp} onValueChange={setSelectedEmp}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um empreendimento" />
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

          <Button 
            onClick={gerarPrevisao} 
            disabled={loading || !selectedEmp}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando histórico...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Gerar Previsão com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {previsao && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Análise Preditiva</CardTitle>
            <CardDescription>
              Baseado em {previsao.totalServicos} serviços analisados · {previsao.anosOperacao} anos de operação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-wrap">
                {previsao.previsao}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!previsao && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma previsão gerada ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Selecione um empreendimento e clique em "Gerar Previsão com IA" para obter 
              uma análise preditiva baseada no histórico de manutenções.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
