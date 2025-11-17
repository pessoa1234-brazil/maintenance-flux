import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
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
import { FormularioAtivo } from "./FormularioAtivo";

interface Ativo {
  id: string;
  nome: string;
  marca_modelo: string;
  sistema_predial: string | null;
  data_instalacao: string;
  garantia_meses: number;
  unidade_id: string;
  unidades: {
    numero: string;
    bloco: string | null;
  };
}

interface GarantiaInfo {
  tipo_garantia: string;
  prazo_anos: number;
  sistema: string;
}

interface AtivosEmpreendimentoProps {
  empreendimentoId: string;
}

export const AtivosEmpreendimento = ({ empreendimentoId }: AtivosEmpreendimentoProps) => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [garantiasMap, setGarantiasMap] = useState<Record<string, GarantiaInfo>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ativoToDelete, setAtivoToDelete] = useState<Ativo | null>(null);

  useEffect(() => {
    loadAtivos();
    loadGarantias();
  }, [empreendimentoId]);

  const loadGarantias = async () => {
    const { data } = await supabase
      .from('garantias_nbr_17170')
      .select('sistema, tipo_garantia, prazo_anos');
    
    if (data) {
      const map: Record<string, GarantiaInfo> = {};
      data.forEach((g) => {
        map[g.sistema] = g;
      });
      setGarantiasMap(map);
    }
  };

  const loadAtivos = async () => {
    try {
      const { data: unidades, error: unidadesError } = await supabase
        .from("unidades")
        .select("id")
        .eq("empreendimento_id", empreendimentoId);

      if (unidadesError) throw unidadesError;

      const unidadeIds = unidades?.map(u => u.id) || [];

      if (unidadeIds.length === 0) {
        setAtivos([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("ativos")
        .select(`
          *,
          unidades (
            numero,
            bloco
          )
        `)
        .in("unidade_id", unidadeIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAtivos(data || []);
    } catch (error) {
      console.error("Erro ao carregar ativos:", error);
      toast.error("Erro ao carregar ativos");
    } finally {
      setLoading(false);
    }
  };

  const calcularStatusGarantia = (ativo: Ativo) => {
    if (!ativo.sistema_predial || !garantiasMap[ativo.sistema_predial]) {
      return { status: 'unknown', label: 'Sistema não vinculado', color: 'secondary' };
    }

    const garantia = garantiasMap[ativo.sistema_predial];
    const dataInstalacao = new Date(ativo.data_instalacao);
    const dataFimGarantia = new Date(dataInstalacao);
    dataFimGarantia.setFullYear(dataFimGarantia.getFullYear() + garantia.prazo_anos);
    
    const hoje = new Date();
    const diasRestantes = Math.floor((dataFimGarantia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { 
        status: 'expired', 
        label: 'Garantia Expirada', 
        color: 'destructive',
        icon: AlertTriangle
      };
    } else if (diasRestantes < 90) {
      return { 
        status: 'expiring', 
        label: `Expira em ${diasRestantes} dias`, 
        color: 'default',
        icon: AlertTriangle
      };
    } else {
      return { 
        status: 'active', 
        label: `${garantia.tipo_garantia} - ${diasRestantes} dias`, 
        color: 'default',
        icon: Shield
      };
    }
  };

  const handleDeleteClick = (ativo: Ativo) => {
    setAtivoToDelete(ativo);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ativoToDelete) return;

    try {
      const { error } = await supabase
        .from("ativos")
        .delete()
        .eq("id", ativoToDelete.id);

      if (error) throw error;

      toast.success("Ativo excluído com sucesso!");
      setAtivos(prev => prev.filter(a => a.id !== ativoToDelete.id));
    } catch (error) {
      console.error("Erro ao excluir ativo:", error);
      toast.error("Erro ao excluir ativo");
    } finally {
      setDeleteDialogOpen(false);
      setAtivoToDelete(null);
    }
  };

  const handleAtivoAdded = () => {
    setShowForm(false);
    loadAtivos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando ativos...</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <FormularioAtivo
        empreendimentoId={empreendimentoId}
        onSuccess={handleAtivoAdded}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Cofre de Ativos</h3>
          <p className="text-muted-foreground">
            Gerencie os ativos vinculados a este empreendimento
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Ativo
        </Button>
      </div>

      {ativos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum ativo cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando o primeiro ativo</p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Ativo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ativos.map((ativo) => {
            const statusGarantia = calcularStatusGarantia(ativo);
            const StatusIcon = statusGarantia.icon;
            
            return (
              <Card key={ativo.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{ativo.nome}</CardTitle>
                        {StatusIcon && (
                          <Badge variant={statusGarantia.color as any} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusGarantia.label}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{ativo.marca_modelo}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(ativo)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Unidade:</span>
                    <Badge variant="outline">
                      {ativo.unidades.bloco && `Bloco ${ativo.unidades.bloco} - `}
                      Unidade {ativo.unidades.numero}
                    </Badge>
                  </div>
                  {ativo.sistema_predial && garantiasMap[ativo.sistema_predial] && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Sistema:</span>
                      <span>{garantiasMap[ativo.sistema_predial].sistema}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Data de Instalação:</span>
                    <span>{new Date(ativo.data_instalacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ativo "{ativoToDelete?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
