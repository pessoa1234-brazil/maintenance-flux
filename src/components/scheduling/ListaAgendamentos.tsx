import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ModalAgendamento } from "./ModalAgendamento";

interface Agendamento {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  created_at: string;
}

export const ListaAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    carregarAgendamentos();

    // Realtime subscription
    const channel = supabase
      .channel("agendamentos-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agendamentos",
        },
        () => {
          carregarAgendamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("solicitante_id", user.id)
        .order("data_inicio", { ascending: true });

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!agendamentoSelecionado) return;

    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "cancelado" })
        .eq("id", agendamentoSelecionado.id);

      if (error) throw error;

      toast.success("Agendamento cancelado com sucesso");
      setShowDeleteDialog(false);
      carregarAgendamentos();
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      toast.error("Erro ao cancelar agendamento");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      agendado: "default",
      concluido: "secondary",
      cancelado: "destructive",
      em_andamento: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando agendamentos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Cadastrados</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os seus agendamentos de manutenção
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agendamentos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum agendamento cadastrado
            </p>
          ) : (
            <div className="space-y-4">
              {agendamentos.map((agendamento) => (
                <Card key={agendamento.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold">{agendamento.titulo}</h4>
                          {getStatusBadge(agendamento.status)}
                        </div>
                        
                        {agendamento.descricao && (
                          <p className="text-sm text-muted-foreground">
                            {agendamento.descricao}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(agendamento.data_inicio).toLocaleDateString("pt-BR")} às{" "}
                              {new Date(agendamento.data_inicio).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <Badge variant="outline">{agendamento.tipo}</Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setAgendamentoSelecionado(agendamento);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {agendamento.status === "agendado" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setAgendamentoSelecionado(agendamento);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setAgendamentoSelecionado(agendamento);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelar}>Sim, cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Detalhes do Agendamento</AlertDialogTitle>
          </AlertDialogHeader>
          {agendamentoSelecionado && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Título</p>
                <p className="text-sm text-muted-foreground">{agendamentoSelecionado.titulo}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Tipo</p>
                <p className="text-sm text-muted-foreground">{agendamentoSelecionado.tipo}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Status</p>
                {getStatusBadge(agendamentoSelecionado.status)}
              </div>
              <div>
                <p className="text-sm font-semibold">Descrição</p>
                <p className="text-sm text-muted-foreground">{agendamentoSelecionado.descricao || "Sem descrição"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Data/Hora Início</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(agendamentoSelecionado.data_inicio).toLocaleString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Data/Hora Fim</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(agendamentoSelecionado.data_fim).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {agendamentoSelecionado && (
        <ModalAgendamento
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setAgendamentoSelecionado(null);
          }}
          dataSelecionada={new Date(agendamentoSelecionado.data_inicio)}
          agendamentoEditando={agendamentoSelecionado}
          onSuccess={carregarAgendamentos}
        />
      )}
    </>
  );
};
