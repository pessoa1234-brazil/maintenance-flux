import { Database } from "@/types";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";

interface AtivosProps {
  db: Database;
  onOpenAtivo: (ativoId: string) => void;
}

interface GarantiaInfo {
  tipo_garantia: string;
  prazo_anos: number;
  sistema: string;
}

export const Ativos = ({ db, onOpenAtivo }: AtivosProps) => {
  const [garantiasMap, setGarantiasMap] = useState<Record<string, GarantiaInfo>>({});

  useEffect(() => {
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

    loadGarantias();
  }, []);

  const calcularStatusGarantia = (ativo: any) => {
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
        color: 'warning',
        icon: AlertTriangle
      };
    } else {
      return { 
        status: 'active', 
        label: `Garantia válida (${garantia.tipo_garantia})`, 
        color: 'success',
        icon: Shield
      };
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Cofre de Ativos</h1>
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <ul className="divide-y divide-border">
          {Object.values(db.ativos).map((ativo) => {
            const statusGarantia = calcularStatusGarantia(ativo);
            const StatusIcon = statusGarantia.icon;
            
            return (
              <li key={ativo.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg text-card-foreground">{ativo.nome}</p>
                      {StatusIcon && (
                        <Badge variant={statusGarantia.color as any} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusGarantia.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{ativo.marcaModelo}</p>
                    {ativo.sistema_predial && garantiasMap[ativo.sistema_predial] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sistema: {garantiasMap[ativo.sistema_predial].sistema}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => onOpenAtivo(ativo.id)} size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
