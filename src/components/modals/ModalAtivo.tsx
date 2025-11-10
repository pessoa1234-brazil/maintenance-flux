import { Ativo } from "@/types";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalAtivoProps {
  ativo: Ativo;
}

export const ModalAtivo = ({ ativo }: ModalAtivoProps) => {
  const dataFimGarantia = new Date(ativo.dataInstalacao);
  dataFimGarantia.setMonth(dataFimGarantia.getMonth() + ativo.garantiaMeses);
  const estaNaGarantia = dataFimGarantia > new Date();
  const dataFimFormatada = dataFimGarantia.toLocaleDateString("pt-BR");

  return (
    <div>
      <div
        className={cn(
          "p-4 border-l-4 rounded-md mb-6",
          estaNaGarantia
            ? "bg-success-bg border-success text-success-foreground"
            : "bg-destructive/10 border-destructive text-destructive"
        )}
      >
        <p className="font-bold text-lg">
          {estaNaGarantia ? `NA GARANTIA (Válida até ${dataFimFormatada})` : `FORA DA GARANTIA (Expirou em ${dataFimFormatada})`}
        </p>
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
