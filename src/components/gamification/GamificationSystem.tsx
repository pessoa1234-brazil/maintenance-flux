import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Award, Target, Clock } from "lucide-react";

interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icon: any;
  requisito: number;
  conquistado: boolean;
}

interface PrestadorStats {
  nivel: number;
  pontos: number;
  proximoNivel: number;
  badges: Badge[];
  servicos_concluidos: number;
  nota_media: number;
  pontualidade: number;
}

export const GamificationSystem = () => {
  const [stats, setStats] = useState<PrestadorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil do prestador
      const { data: profile } = await supabase
        .from("profiles")
        .select("nota_media, total_avaliacoes")
        .eq("id", user.id)
        .single();

      // Buscar OS do prestador
      const { data: osData } = await supabase
        .from("ordens_servico")
        .select("*")
        .eq("prestador_id", user.id);

      const servicosConcluidos = osData?.filter(os => os.status === "CONCLUIDA").length || 0;
      const totalServicos = osData?.length || 0;

      // Calcular pontualidade (serviços concluídos dentro do prazo)
      const noPrazo = osData?.filter(os => 
        os.status === "CONCLUIDA" && 
        os.data_limite_atendimento && 
        os.data_conclusao &&
        new Date(os.data_conclusao) <= new Date(os.data_limite_atendimento)
      ).length || 0;

      const pontualidade = totalServicos > 0 ? (noPrazo / servicosConcluidos) * 100 : 0;

      // Calcular nível e pontos
      const pontos = servicosConcluidos * 10 + (profile?.nota_media || 0) * 20 + pontualidade;
      const nivel = Math.floor(pontos / 100) + 1;
      const proximoNivel = nivel * 100;

      // Definir badges
      const badges: Badge[] = [
        {
          id: "iniciante",
          nome: "Iniciante",
          descricao: "Complete seu primeiro serviço",
          icon: Star,
          requisito: 1,
          conquistado: servicosConcluidos >= 1
        },
        {
          id: "experiente",
          nome: "Experiente",
          descricao: "Complete 10 serviços",
          icon: Trophy,
          requisito: 10,
          conquistado: servicosConcluidos >= 10
        },
        {
          id: "mestre",
          nome: "Mestre",
          descricao: "Complete 50 serviços",
          icon: Award,
          requisito: 50,
          conquistado: servicosConcluidos >= 50
        },
        {
          id: "5_estrelas",
          nome: "5 Estrelas",
          descricao: "Mantenha nota média 4.5+",
          icon: Star,
          requisito: 4.5,
          conquistado: (profile?.nota_media || 0) >= 4.5
        },
        {
          id: "pontual",
          nome: "Pontual",
          descricao: "80% de pontualidade",
          icon: Clock,
          requisito: 80,
          conquistado: pontualidade >= 80
        },
        {
          id: "relampago",
          nome: "Relâmpago",
          descricao: "Complete 20 serviços em um mês",
          icon: Zap,
          requisito: 20,
          conquistado: false // Requer lógica temporal adicional
        }
      ];

      setStats({
        nivel,
        pontos,
        proximoNivel,
        badges,
        servicos_concluidos: servicosConcluidos,
        nota_media: profile?.nota_media || 0,
        pontualidade: Math.round(pontualidade)
      });
    } catch (error) {
      console.error("Erro ao carregar gamificação:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!stats) return null;

  const progressoNivel = ((stats.pontos % 100) / 100) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Gamificação</h2>
        <p className="text-muted-foreground">Seu progresso e conquistas</p>
      </div>

      {/* Nível e Progresso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nível {stats.nivel}</CardTitle>
              <CardDescription>{stats.pontos} pontos totais</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Trophy className="h-5 w-5 mr-2" />
              Nível {stats.nivel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso para Nível {stats.nivel + 1}</span>
              <span>{stats.pontos % 100} / 100 pontos</span>
            </div>
            <Progress value={progressoNivel} />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Serviços Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servicos_concluidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nota_media.toFixed(1)} ⭐</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pontualidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pontualidade}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges e Conquistas</CardTitle>
          <CardDescription>
            {stats.badges.filter(b => b.conquistado).length} de {stats.badges.length} conquistados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    badge.conquistado
                      ? "border-primary bg-primary/5"
                      : "border-muted bg-muted/20 opacity-50"
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`p-3 rounded-full ${
                        badge.conquistado ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{badge.nome}</p>
                      <p className="text-xs text-muted-foreground">{badge.descricao}</p>
                    </div>
                    {badge.conquistado && (
                      <Badge variant="secondary" className="text-xs">
                        Conquistado!
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
