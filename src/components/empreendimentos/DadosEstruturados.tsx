import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DadosEstruturadosProps {
  empreendimentoId: string;
}

interface DadoEstruturado {
  id: string;
  tipo_manual: string;
  categoria: string;
  subcategoria?: string;
  chave: string;
  valor: string;
  unidade?: string;
  pagina?: number;
  secao?: string;
}

export const DadosEstruturados = ({ empreendimentoId }: DadosEstruturadosProps) => {
  const [dados, setDados] = useState<DadoEstruturado[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoSelecionado, setTipoSelecionado] = useState<string>("todos");

  useEffect(() => {
    carregarDados();
  }, [empreendimentoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("manual_dados_estruturados")
        .select("*")
        .eq("empreendimento_id", empreendimentoId)
        .order("categoria", { ascending: true })
        .order("chave", { ascending: true });

      if (error) throw error;
      if (data) setDados(data);
    } catch (error) {
      console.error("Erro ao carregar dados estruturados:", error);
    } finally {
      setLoading(false);
    }
  };

  const dadosFiltrados = tipoSelecionado === "todos" 
    ? dados 
    : dados.filter(d => d.tipo_manual === tipoSelecionado);

  const categorias = Array.from(new Set(dadosFiltrados.map(d => d.categoria)));

  const tiposDisponiveis = Array.from(new Set(dados.map(d => d.tipo_manual)));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando dados estruturados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <Database className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Os manuais ainda não foram processados para extração de dados estruturados.
            </p>
            <p className="text-xs text-muted-foreground">
              Aguarde o processamento dos manuais ou entre em contato com o administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados Estruturados dos Manuais
          </CardTitle>
          <CardDescription>
            Informações extraídas e classificadas automaticamente por IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tipoSelecionado} onValueChange={setTipoSelecionado}>
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              {tiposDisponiveis.includes("proprietario") && (
                <TabsTrigger value="proprietario">Proprietário</TabsTrigger>
              )}
              {tiposDisponiveis.includes("condominio") && (
                <TabsTrigger value="condominio">Condomínio</TabsTrigger>
              )}
              {tiposDisponiveis.includes("usuario") && (
                <TabsTrigger value="usuario">Usuário</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={tipoSelecionado} className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                {categorias.map((categoria) => {
                  const dadosCategoria = dadosFiltrados.filter(d => d.categoria === categoria);
                  
                  return (
                    <Card key={categoria} className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {categoria}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {dadosCategoria.map((dado) => (
                            <div key={dado.id} className="border-l-2 border-primary pl-4 py-2">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{dado.chave}</p>
                                    {dado.subcategoria && (
                                      <Badge variant="outline" className="text-xs">
                                        {dado.subcategoria}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground">
                                    {dado.valor}
                                    {dado.unidade && (
                                      <span className="text-muted-foreground ml-1">
                                        {dado.unidade}
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                    {dado.pagina && (
                                      <span>Página {dado.pagina}</span>
                                    )}
                                    {dado.secao && (
                                      <span>• {dado.secao}</span>
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                      {dado.tipo_manual}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
