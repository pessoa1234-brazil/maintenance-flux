import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Filter, Download, Search } from "lucide-react";
import { ExportToExcel } from "@/components/export/ExportToExcel";

interface Filtros {
  data_inicio: string;
  data_fim: string;
  tipo_servico: string;
  status: string;
  empreendimento_id: string;
  prestador_id: string;
}

export const RelatoriosPersonalizados = () => {
  const [filtros, setFiltros] = useState<Filtros>({
    data_inicio: "",
    data_fim: "",
    tipo_servico: "",
    status: "",
    empreendimento_id: "",
    prestador_id: ""
  });
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([]);
  const [prestadores, setPrestadores] = useState<any[]>([]);

  const loadOptions = async () => {
    // Carregar empreendimentos
    const { data: empData } = await supabase
      .from("empreendimentos")
      .select("id, nome")
      .order("nome");
    if (empData) setEmpreendimentos(empData);

    // Carregar prestadores
    const { data: prestData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    if (prestData) setPrestadores(prestData);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ordens_servico")
        .select(`
          *,
          profiles!ordens_servico_solicitante_id_fkey(full_name),
          unidades(numero, bloco, empreendimentos(nome))
        `);

      // Aplicar filtros
      if (filtros.data_inicio) {
        query = query.gte("data_solicitacao", new Date(filtros.data_inicio).toISOString());
      }
      if (filtros.data_fim) {
        query = query.lte("data_solicitacao", new Date(filtros.data_fim).toISOString());
      }
      if (filtros.tipo_servico) {
        query = query.eq("tipo_servico", filtros.tipo_servico as any);
      }
      if (filtros.status) {
        query = query.eq("status", filtros.status as any);
      }
      if (filtros.prestador_id) {
        query = query.eq("prestador_id", filtros.prestador_id);
      }

      const { data, error } = await query.order("data_solicitacao", { ascending: false });

      if (error) throw error;

      // Filtrar por empreendimento se necessário
      let filtered = data || [];
      if (filtros.empreendimento_id) {
        filtered = filtered.filter(os => {
          const empData = os.unidades?.empreendimentos as any;
          return empData?.id === filtros.empreendimento_id;
        });
      }

      setResultados(filtered);
      toast.success(`${filtered.length} resultado(s) encontrado(s)`);
    } catch (error: any) {
      console.error("Erro ao buscar:", error);
      toast.error("Erro ao buscar resultados");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      "A_FAZER": "default",
      "EM_ANDAMENTO": "secondary",
      "CONCLUIDA": "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Relatórios Personalizados</h2>
        <p className="text-muted-foreground">Filtre e exporte dados com critérios avançados</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Pesquisa
          </CardTitle>
          <CardDescription>Configure os filtros para gerar seu relatório personalizado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo de Serviço</Label>
              <Select value={filtros.tipo_servico} onValueChange={(v) => setFiltros({ ...filtros, tipo_servico: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="garantia">Garantia</SelectItem>
                  <SelectItem value="manutencao_preventiva">Manutenção Preventiva</SelectItem>
                  <SelectItem value="servico_novo">Serviço Novo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filtros.status} onValueChange={(v) => setFiltros({ ...filtros, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="A_FAZER">A Fazer</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Empreendimento</Label>
              <Select 
                value={filtros.empreendimento_id} 
                onValueChange={(v) => setFiltros({ ...filtros, empreendimento_id: v })}
                onOpenChange={(open) => open && loadOptions()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prestador</Label>
              <Select 
                value={filtros.prestador_id} 
                onValueChange={(v) => setFiltros({ ...filtros, prestador_id: v })}
                onOpenChange={(open) => open && loadOptions()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {prestadores.map(prest => (
                    <SelectItem key={prest.id} value={prest.id}>{prest.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              {loading ? "Pesquisando..." : "Pesquisar"}
            </Button>
            <ExportToExcel 
              startDate={filtros.data_inicio ? new Date(filtros.data_inicio) : undefined}
              endDate={filtros.data_fim ? new Date(filtros.data_fim) : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados ({resultados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Empreendimento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((os) => (
                  <TableRow key={os.id}>
                    <TableCell className="font-mono text-xs">{os.id.substring(0, 8)}</TableCell>
                    <TableCell>{os.titulo}</TableCell>
                    <TableCell>{os.unidades?.empreendimentos?.nome || "N/A"}</TableCell>
                    <TableCell>{os.tipo_servico || "servico_novo"}</TableCell>
                    <TableCell>{getStatusBadge(os.status)}</TableCell>
                    <TableCell>{new Date(os.data_solicitacao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      {os.valor_final ? `R$ ${Number(os.valor_final).toLocaleString("pt-BR")}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
