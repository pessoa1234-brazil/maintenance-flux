import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

type SortField = "nome" | "data_entrega" | "total_unidades";
type SortOrder = "asc" | "desc";

export const SelecionarEmpreendimento = ({ onSelect, selectedId }: SelecionarEmpreendimentoProps) => {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [filteredEmps, setFilteredEmps] = useState<Empreendimento[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCidade, setFilterCidade] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("nome");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    carregarEmpreendimentos();
  }, []);

  useEffect(() => {
    let filtered = empreendimentos;

    // Filtro de busca por nome
    if (searchTerm) {
      filtered = filtered.filter((e) =>
        e.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por cidade
    if (filterCidade !== "all") {
      filtered = filtered.filter((e) => e.cidade === filterCidade);
    }

    // Filtro por estado
    if (filterEstado !== "all") {
      filtered = filtered.filter((e) => e.estado === filterEstado);
    }

    // Ordenação
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === "nome") {
        comparison = a.nome.localeCompare(b.nome);
      } else if (sortField === "data_entrega") {
        comparison = new Date(a.data_entrega).getTime() - new Date(b.data_entrega).getTime();
      } else if (sortField === "total_unidades") {
        comparison = a.total_unidades - b.total_unidades;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredEmps(filtered);
    setCurrentPage(1); // Reset para primeira página quando filtros mudam
  }, [searchTerm, filterCidade, filterEstado, sortField, sortOrder, empreendimentos]);

  // Extrair lista única de cidades e estados
  const cidades = Array.from(new Set(empreendimentos.map((e) => e.cidade))).sort();
  const estados = Array.from(new Set(empreendimentos.map((e) => e.estado))).sort();

  // Contar filtros ativos
  const activeFiltersCount = [
    searchTerm !== "",
    filterCidade !== "all",
    filterEstado !== "all",
  ].filter(Boolean).length;

  // Calcular paginação
  const totalPages = Math.ceil(filteredEmps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmps = filteredEmps.slice(startIndex, endIndex);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterCidade("all");
    setFilterEstado("all");
  };

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
      {/* Cabeçalho com contador de filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount} ativo{activeFiltersCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="text-sm">Ordenar por:</Label>
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger id="sort" className="w-[160px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome">Nome</SelectItem>
              <SelectItem value="data_entrega">Data de Entrega</SelectItem>
              <SelectItem value="total_unidades">Nº Unidades</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            className="h-8 w-8 p-0"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="search">Buscar por Nome</Label>
          <Input
            id="search"
            placeholder="Digite o nome do empreendimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={searchTerm ? "ring-2 ring-primary/20" : ""}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="filter-estado">Filtrar por Estado</Label>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger 
                id="filter-estado"
                className={filterEstado !== "all" ? "ring-2 ring-primary/20" : ""}
              >
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {estados.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-cidade">Filtrar por Cidade</Label>
            <Select value={filterCidade} onValueChange={setFilterCidade}>
              <SelectTrigger 
                id="filter-cidade"
                className={filterCidade !== "all" ? "ring-2 ring-primary/20" : ""}
              >
                <SelectValue placeholder="Todas as cidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {cidades.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>
                    {cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Limpar {activeFiltersCount} Filtro{activeFiltersCount > 1 ? "s" : ""}
            </Button>
          </div>
        )}
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentEmps.map((emp) => (
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({filteredEmps.length} empreendimentos)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
