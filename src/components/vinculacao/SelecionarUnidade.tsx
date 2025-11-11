import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Unidade {
  id: string;
  numero: string;
  bloco: string | null;
}

interface SelecionarUnidadeProps {
  empreendimentoId: string;
  onSelect: (unidadeId: string) => void;
  selectedId?: string | null;
}

export const SelecionarUnidade = ({ empreendimentoId, onSelect, selectedId }: SelecionarUnidadeProps) => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [filteredUnidades, setFilteredUnidades] = useState<Unidade[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarUnidades();
  }, [empreendimentoId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = unidades.filter(
        (u) =>
          u.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.bloco && u.bloco.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUnidades(filtered);
    } else {
      setFilteredUnidades(unidades);
    }
  }, [searchTerm, unidades]);

  const carregarUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select("id, numero, bloco")
        .eq("empreendimento_id", empreendimentoId)
        .order("bloco", { ascending: true, nullsFirst: false })
        .order("numero", { ascending: true });

      if (error) throw error;
      setUnidades(data || []);
      setFilteredUnidades(data || []);
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground text-sm">Carregando unidades...</p>
      </div>
    );
  }

  if (unidades.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Nenhuma unidade cadastrada neste empreendimento
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Entre em contato com a construtora para cadastrar as unidades
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search-unidade">Buscar Unidade</Label>
        <Input
          id="search-unidade"
          placeholder="Digite o número ou bloco..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredUnidades.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma unidade encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto">
          {filteredUnidades.map((unidade) => (
            <Card
              key={unidade.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedId === unidade.id ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onClick={() => onSelect(unidade.id)}
            >
              <CardContent className="p-4 text-center">
                <Home
                  className={`h-6 w-6 mx-auto mb-2 ${
                    selectedId === unidade.id ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p className="font-semibold text-sm">{unidade.numero}</p>
                {unidade.bloco && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {unidade.bloco}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
