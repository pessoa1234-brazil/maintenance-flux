import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wrench, Search, Filter, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ExportarCronogramaPDF } from "./ExportarCronogramaPDF";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManutencaoExtraida {
  id: string;
  sistema_predial: string;
  atividade: string;
  periodicidade: string;
  categoria: string;
  subcategoria: string;
}

export const ListaManutencoesExtraidas = () => {
  const [manutencoes, setManutencoes] = useState<ManutencaoExtraida[]>([]);
  const [filteredManutencoes, setFilteredManutencoes] = useState<ManutencaoExtraida[]>([]);
  const [loading, setLoading] = useState(true);
  const [sistemaFiltro, setSistemaFiltro] = useState<string>("todos");
  const [periodicidadeFiltro, setPeriodicidadeFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sistemasDisponiveis, setSistemasDisponiveis] = useState<string[]>([]);
  const [empreendimento, setEmpreendimento] = useState<any>(null);

  useEffect(() => {
    carregarManutencoes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [manutencoes, sistemaFiltro, periodicidadeFiltro, busca]);

  const carregarManutencoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empreendimento_id) {
        setLoading(false);
        return;
      }

      // Carregar dados do empreendimento
      const { data: empData } = await supabase
        .from("empreendimentos")
        .select("*")
        .eq("id", profile.empreendimento_id)
        .single();

      setEmpreendimento(empData);

      const { data, error } = await supabase
        .from("manual_dados_estruturados")
        .select("*")
        .eq("empreendimento_id", profile.empreendimento_id)
        .eq("categoria", "Manutenção Preventiva")
        .order("subcategoria", { ascending: true });

      if (error) throw error;

      const manutencoesData: ManutencaoExtraida[] = data.map((item: any) => ({
        id: item.id,
        sistema_predial: item.subcategoria,
        atividade: item.chave,
        periodicidade: item.valor,
        categoria: item.categoria,
        subcategoria: item.subcategoria,
      }));

      setManutencoes(manutencoesData);

      // Extrair sistemas únicos
      const sistemas = Array.from(new Set(manutencoesData.map(m => m.sistema_predial)));
      setSistemasDisponiveis(sistemas);
    } catch (error) {
      console.error("Erro ao carregar manutenções:", error);
      toast.error("Erro ao carregar manutenções extraídas");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...manutencoes];

    if (sistemaFiltro !== "todos") {
      resultado = resultado.filter(m => m.sistema_predial === sistemaFiltro);
    }

    if (periodicidadeFiltro !== "todos") {
      resultado = resultado.filter(m => m.periodicidade === periodicidadeFiltro);
    }

    if (busca) {
      const searchLower = busca.toLowerCase();
      resultado = resultado.filter(m =>
        m.atividade.toLowerCase().includes(searchLower) ||
        m.sistema_predial.toLowerCase().includes(searchLower)
      );
    }

    setFilteredManutencoes(resultado);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("manual_dados_estruturados")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Manutenção removida com sucesso");
      setManutencoes(prev => prev.filter(m => m.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Erro ao remover manutenção:", error);
      toast.error("Erro ao remover manutenção");
    }
  };

  const limparFiltros = () => {
    setSistemaFiltro("todos");
    setPeriodicidadeFiltro("todos");
    setBusca("");
  };

  const getBadgeVariant = (periodicidade: string) => {
    switch (periodicidade) {
      case "mensal":
        return "default";
      case "bimestral":
      case "trimestral":
        return "secondary";
      case "semestral":
        return "outline";
      case "anual":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando manutenções...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Manutenções Programadas</CardTitle>
              <CardDescription>
                Cronograma extraído dos manuais do proprietário ({manutencoes.length} atividades)
              </CardDescription>
            </div>
            {empreendimento && manutencoes.length > 0 && (
              <ExportarCronogramaPDF manutencoes={manutencoes} empreendimento={empreendimento} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="busca">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  placeholder="Buscar atividade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sistema">Sistema Predial</Label>
              <Select value={sistemaFiltro} onValueChange={setSistemaFiltro}>
                <SelectTrigger id="sistema">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os sistemas</SelectItem>
                  {sistemasDisponiveis.map((sistema) => (
                    <SelectItem key={sistema} value={sistema}>
                      {sistema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="periodicidade">Periodicidade</Label>
              <Select value={periodicidadeFiltro} onValueChange={setPeriodicidadeFiltro}>
                <SelectTrigger id="periodicidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="bimestral">Bimestral</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={limparFiltros} className="w-full gap-2">
                <Filter className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[500px] pr-4">
            {filteredManutencoes.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {manutencoes.length === 0
                    ? "Nenhuma manutenção extraída ainda. Use o botão 'Extrair Cronograma dos Manuais'."
                    : "Nenhuma manutenção encontrada com os filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredManutencoes.map((manutencao) => (
                  <Card key={manutencao.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Wrench className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold">{manutencao.atividade}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {manutencao.sistema_predial}
                                </p>
                              </div>
                              <Badge variant={getBadgeVariant(manutencao.periodicidade)}>
                                {manutencao.periodicidade}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(manutencao.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta manutenção do cronograma?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
