import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Pipeline } from "@/components/pipeline/Pipeline";
import { Ativos } from "@/components/ativos/Ativos";
import { Relatorios } from "@/components/relatorios/Relatorios";
import { ModalOS } from "@/components/modals/ModalOS";
import { ModalAtivoWrapper } from "@/components/modals/ModalAtivoWrapper";
import { useDatabase } from "@/hooks/useDatabase";
import { toast } from "sonner";

type View = "dashboard" | "pipeline" | "ativos" | "relatorios";

const Index = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<View>("dashboard");
  const { db, updateDatabase } = useDatabase();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Carregando...</p>
    </div>;
  }

  const [selectedOSId, setSelectedOSId] = useState<string | null>(null);
  const [selectedAtivoId, setSelectedAtivoId] = useState<string | null>(null);

  const handleAceitarProposta = (orcamentoId: string) => {
    updateDatabase((prevDb) => {
      const orc = prevDb.orcamentos[orcamentoId];
      if (!orc) return prevDb;

      const newOrcamentos = { ...prevDb.orcamentos };
      newOrcamentos[orcamentoId] = { ...orc, status: "ACEITO" };

      Object.keys(newOrcamentos).forEach((key) => {
        const o = newOrcamentos[key];
        if (o.osId === orc.osId && o.id !== orc.id) {
          newOrcamentos[key] = { ...o, status: "RECUSADO" };
        }
      });

      const newOS = { ...prevDb.ordensServico };
      newOS[orc.osId] = {
        ...newOS[orc.osId],
        status: "EM_ANDAMENTO",
        tecnicoId: orc.prestadorId,
      };

      return {
        ...prevDb,
        orcamentos: newOrcamentos,
        ordensServico: newOS,
      };
    });

    toast.success("Proposta aceita! O card foi movido para 'Em Andamento'.");
    setSelectedOSId(null);
    setActiveView("pipeline");
  };

  const handleConcluirServico = (osId: string, checklist: any) => {
    updateDatabase((prevDb) => {
      const newOS = { ...prevDb.ordensServico };
      newOS[osId] = { ...newOS[osId], status: "CONCLUIDA" };

      const newChecklists = { ...prevDb.checklists };
      newChecklists[checklist.id] = checklist;

      return {
        ...prevDb,
        ordensServico: newOS,
        checklists: newChecklists,
      };
    });

    toast.success("Serviço concluído com sucesso e validado pelo checklist!");
    setSelectedOSId(null);
    setActiveView("pipeline");
  };

  const selectedOS = selectedOSId ? db.ordensServico[selectedOSId] : null;
  const selectedAtivo = selectedAtivoId ? db.ativos[selectedAtivoId] : null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeView={activeView} onNavigate={(view) => setActiveView(view as View)} />

      <main className="ml-64 p-8">
        {activeView === "dashboard" && <Dashboard db={db} />}
        {activeView === "pipeline" && <Pipeline db={db} onOpenOS={setSelectedOSId} />}
        {activeView === "ativos" && <Ativos db={db} onOpenAtivo={setSelectedAtivoId} />}
        {activeView === "relatorios" && <Relatorios db={db} />}
      </main>

      {selectedOS && (
        <ModalOS
          os={selectedOS}
          db={db}
          isOpen={!!selectedOSId}
          onClose={() => setSelectedOSId(null)}
          onAceitarProposta={handleAceitarProposta}
          onConcluirServico={handleConcluirServico}
        />
      )}

      {selectedAtivo && (
        <ModalAtivoWrapper ativo={selectedAtivo} isOpen={!!selectedAtivoId} onClose={() => setSelectedAtivoId(null)} />
      )}
    </div>
  );
};

export default Index;
