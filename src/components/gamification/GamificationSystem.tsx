import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, TrendingUp, Award, Zap, Clock } from "lucide-react";
import { toast } from "sonner";

interface PrestadorPontos {
  id: string;
  prestador_id: string;
  pontos_totais: number;
  nivel: number;
  servicos_completados: number;
  avaliacoes_5_estrelas: number;
  tempo_resposta_medio_horas: number | null;
  taxa_conclusao: number;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface BadgeData {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  criterio: string;
  pontos_necessarios: number;
  cor: string;
  raridade: string;
}

interface PrestadorBadge {
  badge_id: string;
  conquistado_em: string;
  badges: BadgeData;
}

interface HistoricoPonto {
  pontos: number;
  motivo: string;
  created_at: string;
}

export const GamificationSystem = () => {
  const [userPontos, setUserPontos] = useState<PrestadorPontos | null>(null);
  const [userBadges, setUserBadges] = useState<PrestadorBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [ranking, setRanking] = useState<PrestadorPontos[]>([]);
  const [historico, setHistorico] = useState<HistoricoPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Carregar pontos do usuário
      const { data: pontos } = await supabase
        .from('prestador_pontos')
        .select('*, profiles(full_name, avatar_url)')
        .eq('prestador_id', user.id)
        .single();

      setUserPontos(pontos);

      // Carregar badges do usuário
      const { data: badges } = await supabase
        .from('prestador_badges')
        .select('*, badges(*)')
        .eq('prestador_id', user.id)
        .order('conquistado_em', { ascending: false });

      setUserBadges(badges || []);

      // Carregar todos os badges disponíveis
      const { data: allBadgesData } = await supabase
        .from('badges')
        .select('*')
        .order('pontos_necessarios', { ascending: true });

      setAllBadges(allBadgesData || []);

      // Carregar ranking (top 10)
      const { data: rankingData } = await supabase
        .from('prestador_pontos')
        .select('*, profiles(full_name, avatar_url)')
        .order('pontos_totais', { ascending: false })
        .limit(10);

      setRanking(rankingData || []);

      // Carregar histórico de pontos
      const { data: historicoData } = await supabase
        .from('historico_pontos')
        .select('*')
        .eq('prestador_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setHistorico(historicoData || []);

    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error);
      toast.error("Erro ao carregar dados de gamificação");
    } finally {
      setLoading(false);
    }
  };

  const getNivelProgress = () => {
    if (!userPontos) return 0;
    const pontosParaProximoNivel = [100, 300, 600, 1000];
    const nivel = userPontos.nivel;
    
    if (nivel >= 5) {
      const base = 1000 + ((nivel - 5) * 500);
      const proximo = base + 500;
      const progresso = ((userPontos.pontos_totais - base) / 500) * 100;
      return Math.min(progresso, 100);
    }
    
    const anterior = nivel === 1 ? 0 : pontosParaProximoNivel[nivel - 2];
    const proximo = pontosParaProximoNivel[nivel - 1];
    const progresso = ((userPontos.pontos_totais - anterior) / (proximo - anterior)) * 100;
    return Math.min(progresso, 100);
  };

  const getRaridadeColor = (raridade: string) => {
    const colors: any = {
      'comum': 'bg-gray-500',
      'raro': 'bg-blue-500',
      'épico': 'bg-purple-500',
      'lendário': 'bg-yellow-500'
    };
    return colors[raridade] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sistema de Gamificação</h2>
        <p className="text-muted-foreground">
          Acompanhe seu progresso, conquistas e ranking
        </p>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPontos?.pontos_totais || 0}</div>
            <p className="text-xs text-muted-foreground">Nível {userPontos?.nivel || 1}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPontos?.servicos_completados || 0}</div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5 Estrelas</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPontos?.avaliacoes_5_estrelas || 0}</div>
            <p className="text-xs text-muted-foreground">Avaliações máximas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userPontos?.tempo_resposta_medio_horas 
                ? `${userPontos.tempo_resposta_medio_horas.toFixed(1)}h`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Resposta</p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso de Nível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progresso do Nível {userPontos?.nivel || 1}
          </CardTitle>
          <CardDescription>
            {userPontos?.pontos_totais || 0} pontos acumulados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={getNivelProgress()} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Continue conquistando pontos para subir de nível!
          </p>
        </CardContent>
      </Card>

      {/* Tabs: Badges, Ranking, Histórico */}
      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suas Conquistas</CardTitle>
              <CardDescription>
                {userBadges.length} de {allBadges.length} badges conquistados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allBadges.map((badge) => {
                  const conquistado = userBadges.find(ub => ub.badge_id === badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        conquistado 
                          ? 'bg-primary/5 border-primary shadow-lg' 
                          : 'bg-muted/20 opacity-50 grayscale'
                      }`}
                    >
                      <div className="text-4xl mb-2">{badge.icone}</div>
                      <h4 className="font-semibold text-sm">{badge.nome}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {badge.descricao}
                      </p>
                      <Badge className={`mt-2 ${getRaridadeColor(badge.raridade)}`}>
                        {badge.raridade}
                      </Badge>
                      {conquistado && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(conquistado.conquistado_em).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top 10 Prestadores
              </CardTitle>
              <CardDescription>Ranking baseado em pontos totais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.map((prestador, index) => (
                  <div
                    key={prestador.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      prestador.prestador_id === currentUserId 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-muted'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{prestador.profiles?.full_name || 'Prestador'}</p>
                        <p className="text-sm text-muted-foreground">
                          Nível {prestador.nivel} · {prestador.servicos_completados} serviços
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{prestador.pontos_totais}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pontos</CardTitle>
              <CardDescription>Últimas 20 conquistas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {historico.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.motivo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant={item.pontos > 0 ? "default" : "destructive"}>
                      {item.pontos > 0 ? '+' : ''}{item.pontos} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
