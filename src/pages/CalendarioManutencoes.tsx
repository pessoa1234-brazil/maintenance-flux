import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CalendarioManutencao } from "@/components/scheduling/CalendarioManutencao";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CalendarioManutencoes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processandoManuais, setProcessandoManuais] = useState(false);
  const [empreendimento, setEmpreendimento] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    await carregarEmpreendimento();
    setLoading(false);

    return () => subscription.unsubscribe();
  };

  const carregarEmpreendimento = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (profile?.empreendimento_id) {
        const { data: emp } = await supabase
          .from("empreendimentos")
          .select("*, manuais_conteudo(*)")
          .eq("id", profile.empreendimento_id)
          .single();

        setEmpreendimento(emp);
      }
    } catch (error) {
      console.error("Erro ao carregar empreendimento:", error);
    }
  };

  const processarManuaisComIA = async () => {
    if (!empreendimento?.id) {
      toast.error("Nenhum empreendimento vinculado");
      return;
    }

    setProcessandoManuais(true);
    try {
      const { data, error } = await supabase.functions.invoke('extrair-cronograma-manutencao', {
        body: { empreendimentoId: empreendimento.id }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Cronograma de manutenção extraído com sucesso dos manuais!");
        // Recarregar dados do calendário
        window.location.reload();
      } else {
        toast.error(data?.error || "Erro ao processar manuais");
      }
    } catch (error: any) {
      console.error("Erro ao processar manuais:", error);
      toast.error(error.message || "Erro ao extrair cronograma de manutenção");
    } finally {
      setProcessandoManuais(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          {empreendimento && (
            <Button 
              onClick={processarManuaisComIA} 
              disabled={processandoManuais}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${processandoManuais ? 'animate-spin' : ''}`} />
              {processandoManuais ? "Processando..." : "Extrair Cronograma dos Manuais"}
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Calendário de Manutenções</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os prazos de manutenção conforme NBR 17170:2022 e NBR 5674
            </p>
          </div>

          {empreendimento && (
            <Card>
              <CardHeader>
                <CardTitle>Empreendimento Vinculado</CardTitle>
                <CardDescription>Informações do seu empreendimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{empreendimento.nome}</span>
                    <Badge variant="outline">
                      {empreendimento.tipo_empreendimento === "condominio" ? "Condomínio" : "Não Condominial"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {empreendimento.endereco}, {empreendimento.cidade} - {empreendimento.estado}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>Data de Entrega: {new Date(empreendimento.data_entrega).toLocaleDateString()}</span>
                    {empreendimento.data_habite_se && (
                      <span>Habite-se: {new Date(empreendimento.data_habite_se).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!empreendimento && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Você precisa estar vinculado a um empreendimento para visualizar o calendário de manutenções.
                  </p>
                  <Button onClick={() => navigate("/vinculacao")}>
                    Vincular Empreendimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {empreendimento && <CalendarioManutencao />}
        </div>
      </div>
    </div>
  );
};

export default CalendarioManutencoes;
