import { OrdemServico, Database } from "@/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  titulo: string;
  ordens: OrdemServico[];
  db: Database;
  onOpenOS: (osId: string) => void;
}

export const KanbanColumn = ({ titulo, ordens, db, onOpenOS }: KanbanColumnProps) => {
  return (
    <div className="w-80 bg-kanban-bg p-4 rounded-lg flex-shrink-0 border border-border">
      <h2 className="font-bold text-foreground mb-4">
        {titulo} ({ordens.length})
      </h2>
      <div className="space-y-3">
        {ordens.map((os) => {
          const tecnico = os.tecnicoId ? db.usuarios[os.tecnicoId] : undefined;
          return <KanbanCard key={os.id} os={os} tecnico={tecnico} onClick={() => onOpenOS(os.id)} />;
        })}
      </div>
    </div>
  );
};
