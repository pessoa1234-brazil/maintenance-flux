import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SelecionarEmpreendimento } from "./SelecionarEmpreendimento";
import { SelecionarUnidade } from "./SelecionarUnidade";
import { ArrowRight, CheckCircle2, Building2, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const VinculacaoEmpreendimento = () => {
  const [step, setStep] = useState<"empreendimento" | "unidade" | "confirmacao">("empreendimento");
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<string | null>(null);
  const [selectedUnidade, setSelectedUnidade] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar perfil atual
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setCurrentProfile(profile);

      if (profile?.empreendimento_id) {
        setSelectedEmpreendimento(profile.empreendimento_id);
        if (profile.unidade_id) {
          setSelectedUnidade(profile.unidade_id);
          setStep("confirmacao");
        } else {
          setStep("unidade");
        }
      }

      // Carregar role do usuário
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setUserRole(roleData?.role || null);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleSelecionarEmpreendimento = (id: string) => {
    setSelectedEmpreendimento(id);
  };

  const handleAvancarParaUnidade = () => {
    if (!selectedEmpreendimento) {
      toast.error("Selecione um empreendimento");
      return;
    }
    setStep("unidade");
  };

  const handleSelecionarUnidade = (id: string) => {
    setSelectedUnidade(id);
  };

  const handleConfirmarVinculacao = async () => {
    if (!selectedEmpreendimento || !selectedUnidade) {
      toast.error("Selecione empreendimento e unidade");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update({
          empreendimento_id: selectedEmpreendimento,
          unidade_id: selectedUnidade,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Vinculação realizada com sucesso!");
      setStep("confirmacao");
      carregarDadosUsuario();
    } catch (error: any) {
      console.error("Erro ao vincular:", error);
      toast.error(error.message || "Erro ao realizar vinculação");
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarVinculacao = () => {
    setStep("empreendimento");
  };

  if (step === "confirmacao" && currentProfile?.empreendimento_id && currentProfile?.unidade_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Vinculação Confirmada
          </CardTitle>
          <CardDescription>
            Você está vinculado a um empreendimento e unidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              Sua conta está vinculada ao empreendimento e unidade selecionados. Você pode alterar
              essa vinculação a qualquer momento.
            </AlertDescription>
          </Alert>

          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Empreendimento vinculado</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Unidade vinculada</span>
            </div>
          </div>

          <Button onClick={handleAlterarVinculacao} variant="outline" className="w-full">
            Alterar Vinculação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vincular ao Empreendimento</CardTitle>
          <CardDescription>
            {userRole === "condominio"
              ? "Vincule sua conta ao empreendimento e unidade que você administra"
              : "Vincule sua conta ao empreendimento e unidade da sua propriedade"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 ${step === "empreendimento" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "empreendimento" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                1
              </div>
              <span className="text-sm font-medium">Empreendimento</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${step === "unidade" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "unidade" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="text-sm font-medium">Unidade</span>
            </div>
          </div>

          {step === "empreendimento" && (
            <div className="space-y-4">
              <SelecionarEmpreendimento
                onSelect={handleSelecionarEmpreendimento}
                selectedId={selectedEmpreendimento}
              />
              <Button
                onClick={handleAvancarParaUnidade}
                disabled={!selectedEmpreendimento}
                className="w-full"
              >
                Avançar para Seleção de Unidade
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "unidade" && selectedEmpreendimento && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("empreendimento")} size="sm">
                  Voltar
                </Button>
              </div>
              <SelecionarUnidade
                empreendimentoId={selectedEmpreendimento}
                onSelect={handleSelecionarUnidade}
                selectedId={selectedUnidade}
              />
              <Button
                onClick={handleConfirmarVinculacao}
                disabled={!selectedUnidade || loading}
                className="w-full"
              >
                {loading ? "Vinculando..." : "Confirmar Vinculação"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
