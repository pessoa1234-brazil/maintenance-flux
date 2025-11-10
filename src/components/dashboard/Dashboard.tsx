import { Database } from "@/types";
import { KPICard } from "./KPICard";

interface DashboardProps {
  db: Database;
}

export const Dashboard = ({ db }: DashboardProps) => {
  const osAbertas = Object.values(db.ordensServico).filter(
    (os) => os.status === "A_FAZER" || os.status === "EM_ANDAMENTO"
  ).length;

  const vencidas = 2; // Mockado

  const naGarantia = Object.values(db.ativos).filter((ativo) => {
    const dataFim = new Date(ativo.dataInstalacao);
    dataFim.setMonth(dataFim.getMonth() + ativo.garantiaMeses);
    return dataFim > new Date();
  }).length;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Dashboard - Condomínio Solaris</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="OS Abertas" value={osAbertas} variant="primary" />
        <KPICard label="Manutenções Vencidas" value={vencidas} variant="destructive" />
        <KPICard label="Ativos na Garantia" value={naGarantia} variant="success" />
      </div>
    </div>
  );
};
