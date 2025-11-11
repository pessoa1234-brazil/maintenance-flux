import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Especificacao {
  id: string;
  categoria: string;
  item: string;
  especificacao: string;
  fonte: string | null;
  pagina: number | null;
}

interface EspecificacoesTecnicasProps {
  empreendimentoId: string;
}

export const EspecificacoesTecnicas = ({ empreendimentoId }: EspecificacoesTecnicasProps) => {
  const [especificacoes, setEspecificacoes] = useState<Especificacao[]>([]);
  const [filteredEspec, setFilteredEspec] = useState<Especificacao[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    categoria: "",
    item: "",
    especificacao: "",
    fonte: "",
    pagina: "",
  });

  useEffect(() => {
    carregarEspecificacoes();
  }, [empreendimentoId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = especificacoes.filter(
        (e) =>
          e.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.especificacao.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEspec(filtered);
    } else {
      setFilteredEspec(especificacoes);
    }
  }, [searchTerm, especificacoes]);

  const carregarEspecificacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("especificacoes_tecnicas")
        .select("*")
        .eq("empreendimento_id", empreendimentoId)
        .order("categoria", { ascending: true });

      if (error) throw error;
      setEspecificacoes(data || []);
      setFilteredEspec(data || []);
    } catch (error) {
      console.error("Erro ao carregar especificações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("especificacoes_tecnicas").insert({
        empreendimento_id: empreendimentoId,
        categoria: formData.categoria,
        item: formData.item,
        especificacao: formData.especificacao,
        fonte: formData.fonte || null,
        pagina: formData.pagina ? parseInt(formData.pagina) : null,
      });

      if (error) throw error;

      toast.success("Especificação adicionada com sucesso!");
      setShowDialog(false);
      setFormData({ categoria: "", item: "", especificacao: "", fonte: "", pagina: "" });
      carregarEspecificacoes();
    } catch (error: any) {
      console.error("Erro ao adicionar especificação:", error);
      toast.error(error.message || "Erro ao adicionar especificação");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("especificacoes_tecnicas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Especificação removida!");
      carregarEspecificacoes();
    } catch (error: any) {
      console.error("Erro ao remover especificação:", error);
      toast.error(error.message || "Erro ao remover especificação");
    }
  };

  const categorias = Array.from(new Set(filteredEspec.map((e) => e.categoria)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando especificações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Banco de Dados Técnico</CardTitle>
              <CardDescription>
                Especificações técnicas dos materiais e sistemas do empreendimento
              </CardDescription>
            </div>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Especificação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar especificações técnicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredEspec.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Nenhuma especificação encontrada"
                  : "Nenhuma especificação cadastrada"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {categorias.map((categoria) => {
                const itens = filteredEspec.filter((e) => e.categoria === categoria);
                return (
                  <div key={categoria}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {categoria}
                      <Badge variant="secondary">{itens.length}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {itens.map((espec) => (
                        <Card key={espec.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">{espec.item}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {espec.especificacao}
                                </p>
                                {(espec.fonte || espec.pagina) && (
                                  <div className="flex gap-2">
                                    {espec.fonte && (
                                      <Badge variant="outline" className="text-xs">
                                        {espec.fonte}
                                      </Badge>
                                    )}
                                    {espec.pagina && (
                                      <Badge variant="outline" className="text-xs">
                                        Pág. {espec.pagina}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(espec.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Especificação Técnica</DialogTitle>
            <DialogDescription>
              Adicione uma especificação técnica ao banco de dados do empreendimento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Hidráulica, Elétrica, Estrutural"
                required
              />
            </div>
            <div>
              <Label htmlFor="item">Item *</Label>
              <Input
                id="item"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                placeholder="Ex: Cano PVC, Disjuntor"
                required
              />
            </div>
            <div>
              <Label htmlFor="especificacao">Especificação *</Label>
              <Textarea
                id="especificacao"
                value={formData.especificacao}
                onChange={(e) => setFormData({ ...formData, especificacao: e.target.value })}
                placeholder="Detalhes técnicos completos"
                required
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fonte">Fonte</Label>
                <Input
                  id="fonte"
                  value={formData.fonte}
                  onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                  placeholder="Ex: Manual do Proprietário"
                />
              </div>
              <div>
                <Label htmlFor="pagina">Página</Label>
                <Input
                  id="pagina"
                  type="number"
                  value={formData.pagina}
                  onChange={(e) => setFormData({ ...formData, pagina: e.target.value })}
                  placeholder="Nº da página"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
