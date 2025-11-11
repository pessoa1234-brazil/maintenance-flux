import { useState } from "react";
import { ListaEmpreendimentos } from "./ListaEmpreendimentos";
import { FormularioEmpreendimento } from "./FormularioEmpreendimento";
import { DetalheEmpreendimento } from "./DetalheEmpreendimento";

type View = "lista" | "novo" | "detalhe";

export const Empreendimentos = () => {
  const [view, setView] = useState<View>("lista");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectEmpreendimento = (id: string) => {
    setSelectedId(id);
    setView("detalhe");
  };

  const handleNovo = () => {
    setView("novo");
  };

  const handleVoltar = () => {
    setSelectedId(null);
    setView("lista");
  };

  const handleSuccess = () => {
    setView("lista");
  };

  return (
    <div>
      {view === "lista" && (
        <ListaEmpreendimentos
          onSelectEmpreendimento={handleSelectEmpreendimento}
          onNovo={handleNovo}
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
      
      {view === "detalhe" && selectedId && (
        <DetalheEmpreendimento id={selectedId} onVoltar={handleVoltar} />
      )}
    </div>
  );
};
