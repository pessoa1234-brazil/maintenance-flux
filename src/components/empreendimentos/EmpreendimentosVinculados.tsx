import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Calendar, Link2 } from "lucide-react";
import { toast } from "sonner";
import { VinculacaoEmpreendimento } from "@/components/vinculacao/VinculacaoEmpreendimento";

interface Empreendimento {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  data_entrega: string;
  total_unidades: number;
}

export const EmpreendimentosVinculados = () => {
  const [empreendimentoVinculado, setEmpreendimentoVinculado] = useState<Empreendimento | null>(null);
  const [unidadeVinculada, setUnidadeVinculada] = useState<{ numero: string; bloco: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVinculacao, setShowVinculacao] = useState(false);

  useEffect(() => {
    carregarVinculacao();
  }, []);

  const carregarVinculacao = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Buscar perfil do usuário com empreendimento e unidade vinculados
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("empreendimento_id, unidade_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.empreendimento_id) {
        // Buscar dados do empreendimento
        const { data: empreendimento, error: empError } = await supabase
          .from("empreendimentos")
          .select("*")
          .eq("id", profile.empreendimento_id)
          .single();

        if (empError) throw empError;
        setEmpreendimentoVinculado(empreendimento);

        // Buscar dados da unidade se existir
        if (profile.unidade_id) {
          const { data: unidade, error: uniError } = await supabase
            .from("unidades")
            .select("numero, bloco")
            .eq("id", profile.unidade_id)
            .single();

          if (uniError) throw uniError;
          setUnidadeVinculada(unidade);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar vinculação:", error);
      toast.error("Erro ao carregar dados de vinculação");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (showVinculacao) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              {empreendimentoVinculado ? "Alterar Vinculação" : "Vincular Empreendimento"}
            </h2>
            <p className="text-muted-foreground">
              {empreendimentoVinculado 
                ? "Selecione um novo empreendimento e unidade" 
                : "Vincule sua conta a um empreendimento e unidade"}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowVinculacao(false)}>
            Voltar
          </Button>
        </div>
        <VinculacaoEmpreendimento />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Meu Empreendimento</h2>
          <p className="text-muted-foreground">
            {empreendimentoVinculado 
              ? "Empreendimento vinculado à sua conta" 
              : "Nenhum empreendimento vinculado"}
          </p>
        </div>
      </div>

      {empreendimentoVinculado ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {empreendimentoVinculado.nome}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {empreendimentoVinculado.endereco}, {empreendimentoVinculado.cidade} - {empreendimentoVinculado.estado}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowVinculacao(true)}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Alterar Vinculação
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data de Entrega</p>
                  <p className="font-medium">
                    {new Date(empreendimentoVinculado.data_entrega).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Unidades</p>
                  <p className="font-medium">{empreendimentoVinculado.total_unidades}</p>
                </div>
              </div>
              {unidadeVinculada && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Unidade Vinculada</p>
                    <p className="font-medium">
                      {unidadeVinculada.bloco ? `${unidadeVinculada.bloco} - ` : ''}
                      Unidade {unidadeVinculada.numero}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum empreendimento vinculado</h3>
            <p className="text-muted-foreground mb-6 text-center">
              Você precisa vincular sua conta a um empreendimento para acessar todas as funcionalidades
            </p>
            <Button onClick={() => setShowVinculacao(true)}>
              <Link2 className="h-4 w-4 mr-2" />
              Vincular Empreendimento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
