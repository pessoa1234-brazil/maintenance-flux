import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, User, FileEdit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoItem {
  id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  motivo_alteracao: string | null;
  versao: number;
  created_at: string;
  alterado_por: string | null;
  usuario?: {
    full_name: string;
  } | null;
}

interface HistoricoManualProps {
  empreendimentoId: string;
  sectionId?: string | null;
}

export const HistoricoManual = ({ empreendimentoId, sectionId }: HistoricoManualProps) => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, [empreendimentoId, sectionId]);

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("manual_proprietario_historico")
        .select("*")
        .eq("empreendimento_id", empreendimentoId)
        .order("created_at", { ascending: false });

      if (sectionId) {
        query = query.eq("conteudo_id", sectionId);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Buscar nomes dos usuários separadamente
      const historicoComUsuarios = await Promise.all(
        (data || []).map(async (item) => {
          if (item.alterado_por) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", item.alterado_por)
              .single();

            return {
              ...item,
              usuario: profile,
            };
          }
          return { ...item, usuario: null };
        })
      );

      setHistorico(historicoComUsuarios);
    } catch (error: any) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCampoLabel = (campo: string) => {
    const labels: Record<string, string> = {
      titulo: "Título",
      conteudo: "Conteúdo",
      visivel: "Visibilidade",
      tipo_conteudo: "Tipo de Conteúdo",
    };
    return labels[campo] || campo;
  };

  const getValorDisplay = (campo: string, valor: string | null) => {
    if (valor === null) return "—";
    if (campo === "visivel") {
      return valor === "true" ? "Visível" : "Oculto";
    }
    if (campo === "conteudo" && valor.length > 100) {
      return valor.substring(0, 100) + "...";
    }
    return valor;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
          <CardDescription>
            Nenhuma alteração registrada ainda
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="w-5 h-5" />
          Histórico de Alterações
        </CardTitle>
        <CardDescription>
          {sectionId 
            ? "Histórico de alterações desta seção"
            : `Últimas ${historico.length} alterações no manual`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {historico.map((item, index) => (
          <div key={item.id}>
            {index > 0 && <Separator className="my-4" />}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Versão {item.versao}
                    </Badge>
                    <Badge variant="secondary">
                      {getCampoLabel(item.campo_alterado)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                    {item.usuario?.full_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.usuario.full_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Valor Anterior
                  </p>
                  <p className="text-sm bg-muted/50 p-2 rounded">
                    {getValorDisplay(item.campo_alterado, item.valor_anterior)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Novo Valor
                  </p>
                  <p className="text-sm bg-primary/5 p-2 rounded border border-primary/20">
                    {getValorDisplay(item.campo_alterado, item.valor_novo)}
                  </p>
                </div>
              </div>

              {item.motivo_alteracao && (
                <div className="pl-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Motivo da Alteração
                  </p>
                  <p className="text-sm italic">{item.motivo_alteracao}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
