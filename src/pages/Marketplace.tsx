import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Send, Clock, AlertCircle } from "lucide-react";

interface OS {
  id: string;
  titulo: string;
  descricao: string;
  tipo_servico: string;
  sistema_predial: string;
  data_limite_atendimento: string | null;
  prazo_atendimento_dias: number | null;
  unidades: {
    numero: string;
    empreendimentos: {
      nome: string;
      endereco: string;
    };
  };
}

const Marketplace = () => {
  const navigate = useNavigate();
  const [osDisponiveis, setOsDisponiveis] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OS | null>(null);
  const [orcamento, setOrcamento] = useState({ valor: "", prazo_dias: "", descricao: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuthAndLoadOS();
  }, []);

  const checkAuthAndLoadOS = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roles?.role !== "prestador") {
      toast.error("Acesso negado. Esta área é exclusiva para prestadores.");
      navigate("/dashboard");
      return;
    }

    await loadOSDisponiveis();
  };

  const loadOSDisponiveis = async () => {
    try {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(`
          id,
          titulo,
          descricao,
          tipo_servico,
          sistema_predial,
          data_limite_atendimento,
          prazo_atendimento_dias,
          unidades!inner(
            numero,
            empreendimentos!inner(
              nome,
              endereco
            )
          )
        `)
        .eq("status", "A_FAZER")
        .is("prestador_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOsDisponiveis(data || []);
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
      toast.error("Erro ao carregar oportunidades");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrcamento = async () => {
    if (!selectedOS) return;
    
    if (!orcamento.valor || !orcamento.descricao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("orcamentos")
        .insert({
          os_id: selectedOS.id,
          prestador_id: user.id,
          valor: parseFloat(orcamento.valor),
          prazo_dias: orcamento.prazo_dias ? parseInt(orcamento.prazo_dias) : null,
          descricao: orcamento.descricao,
          status: "PENDENTE"
        });

      if (error) throw error;

      toast.success("Orçamento enviado com sucesso!");
      setSelectedOS(null);
      setOrcamento({ valor: "", prazo_dias: "", descricao: "" });
      loadOSDisponiveis();
    } catch (error) {
      console.error("Erro ao enviar orçamento:", error);
      toast.error("Erro ao enviar orçamento");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando oportunidades...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Marketplace de Serviços</h1>
          <p className="text-muted-foreground">
            Oportunidades de serviços disponíveis para envio de orçamentos
          </p>
        </div>

        {osDisponiveis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Não há oportunidades disponíveis no momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {osDisponiveis.map((os) => (
              <Card key={os.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{os.titulo}</CardTitle>
                      <CardDescription className="mt-2">
                        {os.unidades.empreendimentos.nome} - Unidade {os.unidades.numero}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        {os.unidades.empreendimentos.endereco}
                      </p>
                    </div>
                    <Badge variant={os.tipo_servico === "garantia" ? "destructive" : "secondary"}>
                      {os.tipo_servico === "garantia" ? "Garantia" :
                       os.tipo_servico === "manutencao_preventiva" ? "Manutenção" : "Novo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {os.descricao && (
                    <p className="text-sm text-muted-foreground mb-4">{os.descricao}</p>
                  )}
                  
                  {os.sistema_predial && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Sistema:</span>
                      <span className="text-sm text-muted-foreground">{os.sistema_predial}</span>
                    </div>
                  )}

                  {os.data_limite_atendimento && (
                    <div className="flex items-center gap-2 mb-4 text-warning">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Prazo: {new Date(os.data_limite_atendimento).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}

                  {os.tipo_servico === "garantia" && os.prazo_atendimento_dias && (
                    <div className="flex items-center gap-2 mb-4 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        Atendimento obrigatório em {os.prazo_atendimento_dias} dias (NBR 17170)
                      </span>
                    </div>
                  )}

                  <Dialog open={selectedOS?.id === os.id} onOpenChange={(open) => !open && setSelectedOS(null)}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedOS(os)} className="w-full gap-2">
                        <Send className="h-4 w-4" />
                        Enviar Orçamento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enviar Orçamento - {os.titulo}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Valor do Serviço (R$) *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={orcamento.valor}
                            onChange={(e) => setOrcamento({ ...orcamento, valor: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Prazo de Execução (dias)
                          </label>
                          <Input
                            type="number"
                            placeholder="Ex: 5"
                            value={orcamento.prazo_dias}
                            onChange={(e) => setOrcamento({ ...orcamento, prazo_dias: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Descrição do Serviço *
                          </label>
                          <Textarea
                            placeholder="Descreva detalhadamente o serviço a ser executado, materiais e metodologia..."
                            value={orcamento.descricao}
                            onChange={(e) => setOrcamento({ ...orcamento, descricao: e.target.value })}
                            rows={4}
                          />
                        </div>

                        <Button
                          onClick={handleSubmitOrcamento}
                          disabled={submitting}
                          className="w-full"
                        >
                          {submitting ? "Enviando..." : "Confirmar Envio"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
