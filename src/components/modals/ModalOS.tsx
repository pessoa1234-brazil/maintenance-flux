import { Database, OrdemServico } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModalMarketplace } from "./ModalMarketplace";
import { ModalChecklist } from "./ModalChecklist";

interface ModalOSProps {
  os: OrdemServico;
  db: Database;
  isOpen: boolean;
  onClose: () => void;
  onAceitarProposta: (orcamentoId: string) => void;
  onConcluirServico: (osId: string, checklist: any) => void;
}

export const ModalOS = ({ os, db, isOpen, onClose, onAceitarProposta, onConcluirServico }: ModalOSProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {os.titulo} (OS-{os.id.substring(2)})
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {os.status === "PENDENTE_ORCAMENTO" && (
            <ModalMarketplace osId={os.id} db={db} onAceitarProposta={onAceitarProposta} />
          )}

          {os.status === "EM_ANDAMENTO" && (() => {
            const checklist = db.checklists[`chk${os.id.substring(2)}`];
            if (checklist) {
              return <ModalChecklist checklist={checklist} onConcluir={(cl) => onConcluirServico(os.id, cl)} />;
            }
            return <p className="text-muted-foreground">Nenhum checklist associado.</p>;
          })()}

          {(os.status === "A_FAZER" || os.status === "CONCLUIDA") && <p className="text-muted-foreground">Status: {os.status}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
};
