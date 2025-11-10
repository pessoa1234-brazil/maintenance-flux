import { Database } from "@/types";
import { Button } from "@/components/ui/button";

interface AtivosProps {
  db: Database;
  onOpenAtivo: (ativoId: string) => void;
}

export const Ativos = ({ db, onOpenAtivo }: AtivosProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Cofre de Ativos</h1>
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <ul className="divide-y divide-border">
          {Object.values(db.ativos).map((ativo) => (
            <li key={ativo.id} className="p-4 flex justify-between items-center hover:bg-accent/50 transition-colors">
              <div>
                <p className="font-semibold text-lg text-card-foreground">{ativo.nome}</p>
                <p className="text-sm text-muted-foreground">{ativo.marcaModelo}</p>
              </div>
              <Button onClick={() => onOpenAtivo(ativo.id)} size="sm">
                Ver Detalhes
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
