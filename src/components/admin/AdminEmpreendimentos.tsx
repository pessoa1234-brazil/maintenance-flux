import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

interface Empreendimento {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  total_unidades: number;
  data_entrega: string;
  created_at: string;
  profiles: { full_name: string };
  _count?: {
    unidades: number;
    os: number;
  };
}

export function AdminEmpreendimentos() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpreendimentos();
  }, []);

  const loadEmpreendimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Carregar construtoras e contagens
      const enrichedData = await Promise.all(
        (data || []).map(async (emp) => {
          const { data: construtora } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', emp.construtora_id)
            .single();

          const { count: unidadesCount } = await supabase
            .from('unidades')
            .select('*', { count: 'exact', head: true })
            .eq('empreendimento_id', emp.id);

          const { count: osCount } = await supabase
            .from('ordens_servico')
            .select('*, unidades!inner(empreendimento_id)', { count: 'exact', head: true })
            .eq('unidades.empreendimento_id', emp.id);

          return {
            ...emp,
            profiles: construtora,
            _count: {
              unidades: unidadesCount || 0,
              os: osCount || 0
            }
          };
        })
      );

      setEmpreendimentos(enrichedData as any);
    } catch (error) {
      console.error('Erro ao carregar empreendimentos:', error);
      toast.error("Erro ao carregar empreendimentos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando empreendimentos...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Empreendimentos Cadastrados</CardTitle>
          <CardDescription>
            {empreendimentos.length} projetos na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {empreendimentos.map((emp) => (
              <Card key={emp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{emp.nome}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {emp.total_unidades} unidades
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {emp.endereco}, {emp.cidade} - {emp.estado}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Entrega: {new Date(emp.data_entrega).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Construtora: {emp.profiles?.full_name || 'N/A'}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Badge variant="outline">
                      {emp._count?.unidades || 0} unidades cadastradas
                    </Badge>
                    <Badge variant="outline">
                      {emp._count?.os || 0} OS registradas
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Cadastrado em {new Date(emp.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
