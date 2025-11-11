import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

interface ModalEditarDadoProps {
  dado: DadoEstruturado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ModalEditarDado = ({
  dado,
  open,
  onOpenChange,
  onSuccess,
}: ModalEditarDadoProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    chave: "",
    valor: "",
    categoria: "",
    subcategoria: "",
    unidade: "",
    motivo: "",
  });

  // Atualizar formData quando dado mudar
  useEffect(() => {
    if (dado) {
      setFormData({
        chave: dado.chave,
        valor: dado.valor,
        categoria: dado.categoria,
        subcategoria: dado.subcategoria || "",
        unidade: dado.unidade || "",
        motivo: "",
      });
    }
  }, [dado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dado) return;

    // Validar se houve alguma alteração
    const houveMudanca =
      formData.chave !== dado.chave ||
      formData.valor !== dado.valor ||
      formData.categoria !== dado.categoria ||
      formData.subcategoria !== (dado.subcategoria || "") ||
      formData.unidade !== (dado.unidade || "");

    if (!houveMudanca) {
      toast.info("Nenhuma alteração foi feita");
      onOpenChange(false);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("manual_dados_estruturados")
        .update({
          chave: formData.chave.trim(),
          valor: formData.valor.trim(),
          categoria: formData.categoria.trim(),
          subcategoria: formData.subcategoria.trim() || null,
          unidade: formData.unidade.trim() || null,
        })
        .eq("id", dado.id);

      if (error) throw error;

      toast.success("Dado atualizado com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar dado:", error);
      toast.error(error.message || "Erro ao atualizar dado");
    } finally {
      setLoading(false);
    }
  };

  if (!dado) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dado Estruturado</DialogTitle>
          <DialogDescription>
            Corrija ou atualize as informações extraídas pela IA. Todas as alterações
            serão registradas no histórico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoria">
                Categoria <span className="text-destructive">*</span>
              </Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) =>
                  setFormData({ ...formData, categoria: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoria">Subcategoria</Label>
              <Input
                id="subcategoria"
                value={formData.subcategoria}
                onChange={(e) =>
                  setFormData({ ...formData, subcategoria: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chave">
              Chave/Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="chave"
              value={formData.chave}
              onChange={(e) => setFormData({ ...formData, chave: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">
              Valor <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="valor"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade de Medida</Label>
            <Input
              id="unidade"
              value={formData.unidade}
              onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
              placeholder="m², kg, anos, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo da Alteração (opcional)
            </Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Descreva por que está fazendo esta correção..."
              rows={2}
            />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">Informações do Registro:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>Tipo: {dado.tipo_manual}</p>
              {dado.pagina && <p>Página: {dado.pagina}</p>}
              {dado.secao && <p>Seção: {dado.secao}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
