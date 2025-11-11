import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface SLAStatus {
  os_id: string;
  titulo: string;
  data_limite: string;
  horas_restantes: number;
  percentual_consumido: number;
  vencido: boolean;
}

export const SistemaSLA = () => {
  const [slaStatus, setSlaStatus] = useState<SLAStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSLAStatus();
    
    // Atualizar a cada minuto
    const interval = setInterval(loadSLAStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadSLAStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: osData } = await supabase
        .from("ordens_servico")
        .select("*")
        .in("status", ["A_FAZER", "EM_ANDAMENTO"])
        .not("data_limite_atendimento", "is", null)
        .order("data_limite_atendimento", { ascending: true });

      if (!osData) return;

      const now = new Date();
      const status: SLAStatus[] = [];

      for (const os of osData) {
        if (!os.data_limite_atendimento) continue;

        const dataLimite = new Date(os.data_limite_atendimento);
        const horasRestantes = (dataLimite.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Buscar prazo total da configuração de SLA
        const { data: slaConfig } = await supabase
          .from("sla_configuracao")
          .select("prazo_conclusao_dias")
          .eq("tipo_servico", os.tipo_servico || "servico_novo")
          .limit(1)
          .single();

        const prazoTotal = (slaConfig?.prazo_conclusao_dias || 30) * 24; // em horas
        const horasConsumidas = prazoTotal - horasRestantes;
        const percentualConsumido = Math.round((horasConsumidas / prazoTotal) * 100);

        status.push({
          os_id: os.id,
          titulo: os.titulo,
          data_limite: os.data_limite_atendimento,
          horas_restantes: Math.round(horasRestantes),
          percentual_consumido: Math.max(0, Math.min(100, percentualConsumido)),
          vencido: horasRestantes <= 0
        });
      }

      setSlaStatus(status);
    } catch (error) {
      console.error("Erro ao carregar SLA:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSLAColor = (percentual: number, vencido: boolean) => {
    if (vencido) return "text-red-600";
    if (percentual >= 80) return "text-orange-600";
    if (percentual >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  const getSLAIcon = (percentual: number, vencido: boolean) => {
    if (vencido) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (percentual >= 80) return <Clock className="h-5 w-5 text-orange-600" />;
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando status de SLA...</p>
      </div>
    );
  }

  const vencidos = slaStatus.filter(s => s.vencido);
  const criticos = slaStatus.filter(s => !s.vencido && s.percentual_consumido >= 80);
  const normais = slaStatus.filter(s => !s.vencido && s.percentual_consumido < 80);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Sistema de SLA</h2>
        <p className="text-muted-foreground">Monitoramento de prazos de atendimento</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              SLAs Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{vencidos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              SLAs Críticos (≥80%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{criticos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              SLAs Normais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{normais.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de OS com SLA */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço Monitoradas</CardTitle>
          <CardDescription>
            {slaStatus.length} OS(s) com prazo de atendimento ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slaStatus.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma OS com SLA ativo no momento
            </p>
          ) : (
            <div className="space-y-4">
              {slaStatus.map((item) => (
                <div key={item.os_id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSLAIcon(item.percentual_consumido, item.vencido)}
                        <h4 className="font-semibold">{item.titulo}</h4>
                        {item.vencido && <Badge variant="destructive">VENCIDO</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ID: {item.os_id.substring(0, 8)} • 
                        Prazo: {new Date(item.data_limite).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getSLAColor(item.percentual_consumido, item.vencido)}`}>
                        {item.percentual_consumido}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.vencido ? "Prazo excedido" : `${item.horas_restantes}h restantes`}
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={item.percentual_consumido} 
                    className={`h-2 ${
                      item.vencido 
                        ? "[&>div]:bg-red-600" 
                        : item.percentual_consumido >= 80 
                          ? "[&>div]:bg-orange-600" 
                          : "[&>div]:bg-green-600"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
