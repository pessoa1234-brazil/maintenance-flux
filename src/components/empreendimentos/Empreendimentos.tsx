import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListaEmpreendimentos } from "./ListaEmpreendimentos";
import { FormularioEmpreendimento } from "./FormularioEmpreendimento";
import { DetalheEmpreendimento } from "./DetalheEmpreendimento";
import { EmpreendimentosVinculados } from "./EmpreendimentosVinculados";
import { toast } from "sonner";

type View = "lista" | "novo" | "detalhe" | "duplicar";

export const Empreendimentos = () => {
  const [view, setView] = useState<View>("lista");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Usuário não autenticado");
          return;
        }

        // Buscar role do usuário
        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        
        if (roleData) {
          setUserRole(roleData.role);
        }
      } catch (error) {
        console.error("Erro ao carregar role do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const handleSelectEmpreendimento = (id: string) => {
    setSelectedId(id);
    setView("detalhe");
  };

  const handleNovo = () => {
    setDuplicateData(null);
    setView("novo");
  };

  const handleDuplicar = (empreendimento: any) => {
    setDuplicateData(empreendimento);
    setView("duplicar");
  };

  const handleVoltar = () => {
    setSelectedId(null);
    setDuplicateData(null);
    setView("lista");
  };

  const handleSuccess = () => {
    setDuplicateData(null);
    setView("lista");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se for cliente, condominio ou prestador, mostrar apenas vinculação
  if (userRole === "cliente" || userRole === "condominio" || userRole === "prestador") {
    return <EmpreendimentosVinculados />;
  }

  // Para construtora e admin, mostrar funcionalidade completa de gerenciamento
  return (
    <div>
      {view === "lista" && (
        <ListaEmpreendimentos
          onSelectEmpreendimento={handleSelectEmpreendimento}
          onNovo={handleNovo}
          onDuplicar={handleDuplicar}
        />
      )}
      
      {view === "novo" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Novo Empreendimento</h2>
            <p className="text-muted-foreground">Cadastre um novo empreendimento</p>
          </div>
          <FormularioEmpreendimento onSuccess={handleSuccess} onCancel={handleVoltar} />
        </div>
      )}

      {view === "duplicar" && duplicateData && (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Duplicar Empreendimento</h2>
            <p className="text-muted-foreground">
              Crie um novo empreendimento baseado em: <span className="font-semibold">{duplicateData.nome}</span>
            </p>
          </div>
          <FormularioEmpreendimento 
            onSuccess={handleSuccess} 
            onCancel={handleVoltar}
            initialData={duplicateData}
            isDuplicating={true}
          />
        </div>
      )}
      
      {view === "detalhe" && selectedId && (
        <DetalheEmpreendimento id={selectedId} onVoltar={handleVoltar} />
      )}
    </div>
  );
};
