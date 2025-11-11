import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Empreendimento {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  data_entrega: string;
  total_unidades: number;
}

interface SelecionarEmpreendimentoProps {
  onSelect: (empreendimentoId: string) => void;
  selectedId?: string | null;
}

export const SelecionarEmpreendimento = ({ onSelect, selectedId }: SelecionarEmpreendimentoProps) => {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [filteredEmps, setFilteredEmps] = useState<Empreendimento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEmpreendimentos();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = empreendimentos.filter(
        (e) =>
          e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.estado.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmps(filtered);
    } else {
      setFilteredEmps(empreendimentos);
    }
  }, [searchTerm, empreendimentos]);

  const carregarEmpreendimentos = async () => {
    try {
      const { data, error } = await supabase
        .from("empreendimentos")
        .select("id, nome, endereco, cidade, estado, data_entrega, total_unidades")
        .order("nome", { ascending: true });

      if (error) throw error;
      setEmpreendimentos(data || []);
      setFilteredEmps(data || []);
    } catch (error) {
      console.error("Erro ao carregar empreendimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando empreendimentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search">Buscar Empreendimento</Label>
        <Input
          id="search"
          placeholder="Digite o nome, cidade ou estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredEmps.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum empreendimento encontrado" : "Nenhum empreendimento disponível"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
          {filteredEmps.map((emp) => (
            <Card
              key={emp.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedId === emp.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelect(emp.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between text-base">
                  <span className="line-clamp-2">{emp.nome}</span>
                  <Building2
                    className={`h-5 w-5 flex-shrink-0 ml-2 ${
                      selectedId === emp.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {emp.cidade}, {emp.estado}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Entrega: {new Date(emp.data_entrega).toLocaleDateString("pt-BR")}
                </div>
                <Badge variant="secondary">{emp.total_unidades} unidades</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
