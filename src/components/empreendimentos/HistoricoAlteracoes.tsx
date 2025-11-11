import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, History, User, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HistoricoItem {
  id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  motivo: string | null;
  created_at: string;
  user_id: string;
}

interface HistoricoAlteracoesProps {
  dadoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABELS_CAMPOS: Record<string, string> = {
  chave: "Chave/Nome",
  valor: "Valor",
  categoria: "Categoria",
  subcategoria: "Subcategoria",
  unidade: "Unidade de Medida",
};

export const HistoricoAlteracoes = ({
  dadoId,
  open,
  onOpenChange,
}: HistoricoAlteracoesProps) => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && dadoId) {
      carregarHistorico();
    }
  }, [open, dadoId]);

  const carregarHistorico = async () => {
    if (!dadoId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("manual_dados_historico")
        .select("*")
        .eq("dado_id", dadoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setHistorico(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </DialogTitle>
          <DialogDescription>
            Registro completo de todas as modificações realizadas neste dado
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Carregando histórico...</p>
            </div>
          </div>
        ) : historico.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma alteração foi registrada para este dado ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {historico.map((item, index) => (
                <div key={item.id}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* Cabeçalho da alteração */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {LABELS_CAMPOS[item.campo_alterado] || item.campo_alterado}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                foi alterado
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                ID: {item.user_id.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Comparação de valores */}
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Valor Anterior:
                            </p>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                              <p className="text-sm">
                                {item.valor_anterior || (
                                  <span className="text-muted-foreground italic">
                                    (vazio)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Valor Novo:
                            </p>
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <p className="text-sm">
                                {item.valor_novo || (
                                  <span className="text-muted-foreground italic">
                                    (vazio)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Motivo da alteração */}
                        {item.motivo && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Motivo:
                            </p>
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm">{item.motivo}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {index < historico.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
