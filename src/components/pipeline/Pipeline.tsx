import { Database, StatusOS } from "@/types";
import { KanbanColumn } from "./KanbanColumn";

interface PipelineProps {
  db: Database;
  onOpenOS: (osId: string) => void;
}

const colunas: { status: StatusOS; titulo: string }[] = [
  { status: "A_FAZER", titulo: "A Fazer" },
  { status: "PENDENTE_ORCAMENTO", titulo: "Pendente Orçamento" },
  { status: "EM_ANDAMENTO", titulo: "Em Andamento" },
  { status: "CONCLUIDA", titulo: "Concluída" },
];

export const Pipeline = ({ db, onOpenOS }: PipelineProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Pipeline de Ordens de Serviço</h1>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {colunas.map((coluna) => {
          const ordens = Object.values(db.ordensServico).filter((os) => os.status === coluna.status);
          return <KanbanColumn key={coluna.status} titulo={coluna.titulo} ordens={ordens} db={db} onOpenOS={onOpenOS} />;
        })}
      </div>
    </div>
  );
};
