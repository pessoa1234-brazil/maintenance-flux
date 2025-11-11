import { useState } from "react";
import { ListaEmpreendimentos } from "./ListaEmpreendimentos";
import { FormularioEmpreendimento } from "./FormularioEmpreendimento";
import { DetalheEmpreendimento } from "./DetalheEmpreendimento";

type View = "lista" | "novo" | "detalhe" | "duplicar";

export const Empreendimentos = () => {
  const [view, setView] = useState<View>("lista");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duplicateData, setDuplicateData] = useState<any>(null);

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
