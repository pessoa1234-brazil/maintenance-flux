import { Database, Orcamento } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalMarketplaceProps {
  osId: string;
  db: Database;
  onAceitarProposta: (orcamentoId: string) => void;
}

export const ModalMarketplace = ({ osId, db, onAceitarProposta }: ModalMarketplaceProps) => {
  const orcamentos = Object.values(db.orcamentos).filter((o) => o.osId === osId);

  if (orcamentos.length === 0) {
    return (
      <div>
        <h4 className="font-semibold text-lg mb-4">Propostas Recebidas (Marketplace)</h4>
        <p className="text-muted-foreground">Aguardando envio de propostas...</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">Propostas Recebidas (Marketplace)</h4>
      <div className="space-y-4">
        {orcamentos.map((orc) => {
          const prestador = db.usuarios[orc.prestadorId];
          const isAceito = orc.status === "ACEITO";
          const isRecusado = orc.status === "RECUSADO";

          return (
            <div
              key={orc.id}
              className={cn(
                "p-4 border rounded-lg transition-colors",
                isAceito && "border-success bg-success-bg",
                isRecusado && "border-destructive/50 bg-destructive/5",
                !isAceito && !isRecusado && "border-border bg-card"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <strong className="text-lg">
                    {prestador.nome} <span className="text-warning">⭐️ {prestador.nota}</span>
                  </strong>
                  <p className="text-2xl font-bold text-success mt-1">R$ {orc.valor.toFixed(2)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{orc.descricao}</p>
                </div>
                <div className="ml-4">
                  {orc.status === "PENDENTE" && (
                    <Button onClick={() => onAceitarProposta(orc.id)} className="bg-success hover:bg-success/90">
                      Aceitar Proposta
                    </Button>
                  )}
                  {isAceito && <span className="font-bold text-success text-sm">✅ ACEITO</span>}
                  {isRecusado && <span className="font-bold text-destructive text-sm">RECUSADO</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
