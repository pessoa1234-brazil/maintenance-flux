import { Ativo } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModalAtivo } from "./ModalAtivo";

interface ModalAtivoWrapperProps {
  ativo: Ativo;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalAtivoWrapper = ({ ativo, isOpen, onClose }: ModalAtivoWrapperProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ativo.nome} ({ativo.marcaModelo})
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ModalAtivo ativo={ativo} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
