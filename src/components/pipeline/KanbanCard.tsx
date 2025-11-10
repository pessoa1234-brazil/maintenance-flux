import { OrdemServico, Usuario } from "@/types";

interface KanbanCardProps {
  os: OrdemServico;
  tecnico?: Usuario;
  onClick: () => void;
}

export const KanbanCard = ({ os, tecnico, onClick }: KanbanCardProps) => {
  return (
    <div
      onClick={onClick}
      className="p-4 mb-3 rounded-lg bg-kanban-card hover:bg-kanban-card-hover shadow-sm border border-border cursor-pointer transition-all hover:shadow-md"
    >
      <h3 className="font-semibold text-card-foreground mb-1">{os.titulo}</h3>
      {tecnico && <span className="text-xs text-muted-foreground">Téc: {tecnico.nome}</span>}
    </div>
  );
};
