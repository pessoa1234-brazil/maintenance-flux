import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface Avaliacao {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface ListaAvaliacoesProps {
  prestadorId: string;
}

export const ListaAvaliacoes = ({ prestadorId }: ListaAvaliacoesProps) => {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [notaMedia, setNotaMedia] = useState(0);

  useEffect(() => {
    loadAvaliacoes();
  }, [prestadorId]);

  const loadAvaliacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select(`
          id,
          nota,
          comentario,
          created_at,
          profiles!avaliacoes_avaliador_id_fkey(full_name)
        `)
        .eq("prestador_id", prestadorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setAvaliacoes(data as any || []);
      
      if (data && data.length > 0) {
        const media = data.reduce((sum, av) => sum + av.nota, 0) / data.length;
        setNotaMedia(media);
      }
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando avaliações...</p>
        </CardContent>
      </Card>
    );
  }

  if (avaliacoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Avaliações ({avaliacoes.length})</span>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{notaMedia.toFixed(1)}</span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {avaliacoes.map((av) => (
        <Card key={av.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>
                  {av.profiles.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{av.profiles.full_name}</p>
                  <span className="text-sm text-muted-foreground">
                    {new Date(av.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < av.nota
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                
                {av.comentario && (
                  <p className="text-sm text-muted-foreground">{av.comentario}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
