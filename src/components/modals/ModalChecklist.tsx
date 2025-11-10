import { useState } from "react";
import { Checklist, ItemChecklist } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModalChecklistProps {
  checklist: Checklist;
  onConcluir: (checklist: Checklist) => void;
}

export const ModalChecklist = ({ checklist, onConcluir }: ModalChecklistProps) => {
  const [itens, setItens] = useState<ItemChecklist[]>(checklist.itens);
  const [erro, setErro] = useState<string>("");

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, respostaBool: checked, preenchido: checked } : item
      )
    );
  };

  const handleTextoChange = (itemId: string, value: string) => {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, respostaTexto: value, preenchido: value.trim() !== "" } : item
      )
    );
  };

  const handleFotoChange = (itemId: string, file: File | null) => {
    if (file) {
      setItens((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, respostaUrl: "https://placehold.co/100x100?text=FOTO", preenchido: true }
            : item
        )
      );
    }
  };

  const handleConcluir = () => {
    const itensPendentes = itens.filter((item) => item.obrigatorio && !item.preenchido).length;

    if (itensPendentes > 0) {
      setErro(`Ação bloqueada. ${itensPendentes} item(ns) obrigatório(s) não foi(ram) preenchido(s).`);
      return;
    }

    onConcluir({ ...checklist, itens });
  };

  return (
    <div>
      <h4 className="font-semibold text-lg mb-4">Checklist de Execução</h4>
      <div className="space-y-4">
        {itens.map((item) => (
          <div key={item.id} className="p-3 bg-muted/50 rounded-md border border-border">
            {item.tipo === "CHECKBOX" && (
              <div className="flex items-center justify-between">
                <Label htmlFor={item.id} className="flex-1">
                  {item.texto}
                  {item.obrigatorio && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Checkbox
                  id={item.id}
                  checked={item.respostaBool || false}
                  onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
                  className="h-5 w-5"
                />
              </div>
            )}

            {item.tipo === "TEXTO" && (
              <div>
                <Label htmlFor={item.id}>
                  {item.texto}
                  {item.obrigatorio && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={item.id}
                  type="text"
                  value={item.respostaTexto || ""}
                  onChange={(e) => handleTextoChange(item.id, e.target.value)}
                  placeholder="Adicionar observação..."
                  className="mt-2"
                />
              </div>
            )}

            {item.tipo === "FOTO" && (
              <div>
                <Label htmlFor={item.id}>
                  {item.texto}
                  {item.obrigatorio && <span className="text-destructive ml-1">*</span>}
                </Label>
                {item.respostaUrl ? (
                  <img src={item.respostaUrl} alt="Foto anexada" className="mt-2 w-32 h-32 object-cover rounded-md" />
                ) : (
                  <Input
                    id={item.id}
                    type="file"
                    onChange={(e) => handleFotoChange(item.id, e.target.files?.[0] || null)}
                    className="mt-2"
                    accept="image/*"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {erro && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive font-medium">{erro}</p>
        </div>
      )}

      <Button onClick={handleConcluir} className="mt-6 w-full bg-success hover:bg-success/90 text-lg font-semibold">
        Concluir Serviço
      </Button>
    </div>
  );
};
