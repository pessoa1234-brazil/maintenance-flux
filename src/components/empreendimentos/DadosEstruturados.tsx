import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, FileText, Search, Filter, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const [textoBusca, setTextoBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState<string>("todas");

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

  // Aplicar filtros em cascata
  const dadosFiltrados = dados.filter(dado => {
    // Filtro por tipo de manual
    if (tipoSelecionado !== "todos" && dado.tipo_manual !== tipoSelecionado) {
      return false;
    }

    // Filtro por categoria
    if (categoriaFiltro !== "todas" && dado.categoria !== categoriaFiltro) {
      return false;
    }

    // Filtro por subcategoria
    if (subcategoriaFiltro !== "todas" && dado.subcategoria !== subcategoriaFiltro) {
      return false;
    }

    // Busca por texto completo (case insensitive)
    if (textoBusca.trim()) {
      const termoLower = textoBusca.toLowerCase();
      const contemTexto = 
        dado.chave.toLowerCase().includes(termoLower) ||
        dado.valor.toLowerCase().includes(termoLower) ||
        dado.categoria.toLowerCase().includes(termoLower) ||
        (dado.subcategoria && dado.subcategoria.toLowerCase().includes(termoLower)) ||
        (dado.secao && dado.secao.toLowerCase().includes(termoLower)) ||
        (dado.unidade && dado.unidade.toLowerCase().includes(termoLower));
      
      if (!contemTexto) return false;
    }

    return true;
  });

  const categorias = Array.from(new Set(dadosFiltrados.map(d => d.categoria)));
  const todasCategorias = Array.from(new Set(dados.map(d => d.categoria)));
  
  // Subcategorias disponíveis para a categoria selecionada
  const subcategoriasDisponiveis = Array.from(
    new Set(
      dados
        .filter(d => categoriaFiltro === "todas" || d.categoria === categoriaFiltro)
        .map(d => d.subcategoria)
        .filter(Boolean)
    )
  );

  const tiposDisponiveis = Array.from(new Set(dados.map(d => d.tipo_manual)));

  const limparFiltros = () => {
    setTextoBusca("");
    setCategoriaFiltro("todas");
    setSubcategoriaFiltro("todas");
  };

  const filtrosAtivos = [
    textoBusca.trim() !== "",
    categoriaFiltro !== "todas",
    subcategoriaFiltro !== "todas"
  ].filter(Boolean).length;

  // Função para destacar texto da busca
  const destacarTexto = (texto: string) => {
    if (!textoBusca.trim()) return texto;
    
    const regex = new RegExp(`(${textoBusca})`, 'gi');
    const partes = texto.split(regex);
    
    return partes.map((parte, i) => 
      regex.test(parte) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">
          {parte}
        </mark>
      ) : (
        parte
      )
    );
  };

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Dados Estruturados dos Manuais
              </CardTitle>
              <CardDescription>
                Informações extraídas e classificadas automaticamente por IA
              </CardDescription>
            </div>
            {filtrosAtivos > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                {filtrosAtivos} {filtrosAtivos === 1 ? "filtro ativo" : "filtros ativos"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca e Filtros */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Busca e Filtros</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Busca por texto */}
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="busca-texto">Buscar por texto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="busca-texto"
                    placeholder="Digite para buscar..."
                    value={textoBusca}
                    onChange={(e) => setTextoBusca(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Filtro por categoria */}
              <div className="space-y-2">
                <Label htmlFor="filtro-categoria">Categoria</Label>
                <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                  <SelectTrigger id="filtro-categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    {todasCategorias.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por subcategoria */}
              <div className="space-y-2">
                <Label htmlFor="filtro-subcategoria">Subcategoria</Label>
                <Select 
                  value={subcategoriaFiltro} 
                  onValueChange={setSubcategoriaFiltro}
                  disabled={subcategoriasDisponiveis.length === 0}
                >
                  <SelectTrigger id="filtro-subcategoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {subcategoriasDisponiveis.map(sub => (
                      <SelectItem key={sub} value={sub!}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão limpar filtros */}
            {filtrosAtivos > 0 && (
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={limparFiltros}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            )}

            {/* Contador de resultados */}
            <div className="text-sm text-muted-foreground">
              {dadosFiltrados.length === dados.length ? (
                <span>Mostrando todos os {dados.length} registros</span>
              ) : (
                <span>
                  Mostrando {dadosFiltrados.length} de {dados.length} registros
                </span>
              )}
            </div>
          </div>
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
              {dadosFiltrados.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum resultado encontrado para os filtros aplicados.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={limparFiltros}
                    >
                      Limpar filtros
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  {categorias.map((categoria) => {
                    const dadosCategoria = dadosFiltrados.filter(d => d.categoria === categoria);
                    
                    return (
                      <Card key={categoria} className="mb-4">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {destacarTexto(categoria)}
                            </CardTitle>
                            <Badge variant="secondary">{dadosCategoria.length}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {dadosCategoria.map((dado) => (
                              <div key={dado.id} className="border-l-2 border-primary pl-4 py-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium text-sm">{destacarTexto(dado.chave)}</p>
                                      {dado.subcategoria && (
                                        <Badge variant="outline" className="text-xs">
                                          {destacarTexto(dado.subcategoria)}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-foreground">
                                      {destacarTexto(dado.valor)}
                                      {dado.unidade && (
                                        <span className="text-muted-foreground ml-1">
                                          {destacarTexto(dado.unidade)}
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                                      {dado.pagina && (
                                        <span>Página {dado.pagina}</span>
                                      )}
                                      {dado.secao && (
                                        <span>• {destacarTexto(dado.secao)}</span>
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
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
