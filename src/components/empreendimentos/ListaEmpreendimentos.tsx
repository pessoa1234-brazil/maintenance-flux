import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Calendar, Plus, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Empreendimento {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  numero_apartamentos: number | null;
  numero_andares: number | null;
  data_entrega: string;
  total_unidades: number;
}

interface ListaEmpreendimentosProps {
  onSelectEmpreendimento: (id: string) => void;
  onNovo: () => void;
  onDuplicar: (empreendimento: Empreendimento) => void;
}

export const ListaEmpreendimentos = ({ onSelectEmpreendimento, onNovo, onDuplicar }: ListaEmpreendimentosProps) => {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEmpreendimentos();
  }, []);

  const carregarEmpreendimentos = async () => {
    try {
      const { data, error } = await supabase
        .from("empreendimentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmpreendimentos(data || []);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Empreendimentos</h2>
          <p className="text-muted-foreground">Gerencie seus empreendimentos cadastrados</p>
        </div>
        <Button onClick={onNovo} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Empreendimento
        </Button>
      </div>

      {empreendimentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum empreendimento cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece cadastrando seu primeiro empreendimento</p>
            <Button onClick={onNovo} className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Empreendimento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empreendimentos.map((emp) => (
            <Card
              key={emp.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="line-clamp-1">{emp.nome}</span>
                  <Building2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {emp.cidade}, {emp.estado}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  className="cursor-pointer"
                  onClick={() => onSelectEmpreendimento(emp.id)}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Entrega: {new Date(emp.data_entrega).toLocaleDateString("pt-BR")}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mt-3">
                    <Badge variant="secondary">
                      {emp.total_unidades} unidades
                    </Badge>
                    {emp.numero_andares && (
                      <Badge variant="outline">
                        {emp.numero_andares} andares
                      </Badge>
                    )}
                    {emp.numero_apartamentos && (
                      <Badge variant="outline">
                        {emp.numero_apartamentos} apts
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-3">
                    {emp.endereco}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicar(emp);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicar Empreendimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
