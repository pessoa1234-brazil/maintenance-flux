import { Ativo } from "@/types";
import { FileText, Shield, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface ModalAtivoProps {
  ativo: Ativo;
}

export const ModalAtivo = ({ ativo }: ModalAtivoProps) => {
  const [garantiaNBR, setGarantiaNBR] = useState<any>(null);

  useEffect(() => {
    const loadGarantiaNBR = async () => {
      if (!ativo.sistema_predial) return;
      
      const { data } = await supabase
        .from('garantias_nbr_17170')
        .select('*')
        .eq('sistema', ativo.sistema_predial)
        .maybeSingle();
      
      setGarantiaNBR(data);
    };

    loadGarantiaNBR();
  }, [ativo.sistema_predial]);

  const dataInstalacao = new Date(ativo.dataInstalacao);
  const dataFimGarantia = garantiaNBR 
    ? new Date(dataInstalacao.getFullYear() + garantiaNBR.prazo_anos, dataInstalacao.getMonth(), dataInstalacao.getDate())
    : new Date(dataInstalacao.getTime() + ativo.garantiaMeses * 30 * 24 * 60 * 60 * 1000);
  
  const estaNaGarantia = dataFimGarantia > new Date();
  const dataFimFormatada = dataFimGarantia.toLocaleDateString("pt-BR");
  const diasRestantes = Math.floor((dataFimGarantia.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div>
      <div
        className={cn(
          "p-4 border-l-4 rounded-md mb-6",
          estaNaGarantia
            ? "bg-success/10 border-success text-success-foreground"
            : "bg-destructive/10 border-destructive text-destructive"
        )}
      >
        <div className="flex items-start gap-3">
          {estaNaGarantia ? (
            <Shield className="h-6 w-6 mt-0.5" />
          ) : (
            <AlertTriangle className="h-6 w-6 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold text-lg mb-2">
              {estaNaGarantia ? `GARANTIA ATIVA` : `GARANTIA EXPIRADA`}
            </p>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {estaNaGarantia 
                  ? `Válida até ${dataFimFormatada} (${diasRestantes} dias restantes)`
                  : `Expirou em ${dataFimFormatada}`
                }
              </p>
              {garantiaNBR && (
                <>
                  <p className="font-medium mt-2">Sistema NBR 17170: {garantiaNBR.sistema}</p>
                  <p>Tipo de Garantia: <Badge variant="outline">{garantiaNBR.tipo_garantia === 'legal' ? 'Legal' : 'Oferecida'}</Badge></p>
                  <p>Prazo: {garantiaNBR.prazo_anos} {garantiaNBR.prazo_anos === 1 ? 'ano' : 'anos'}</p>
                  {garantiaNBR.descricao && (
                    <p className="text-xs mt-2 opacity-80">{garantiaNBR.descricao}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-lg mb-4">Documentos (O Cofre)</h4>
        <ul className="divide-y divide-border">
          {ativo.documentos.map((doc) => (
            <li key={doc.id} className="py-3 flex items-center justify-between hover:bg-accent/50 rounded px-2 transition-colors">
              <div className="flex items-center">
                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                <div>
                  <span className="font-medium">{doc.nome}</span>
                  <span className="text-xs text-muted-foreground ml-2">({doc.tipo})</span>
                </div>
              </div>
              <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm font-medium">
                Ver Anexo
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
