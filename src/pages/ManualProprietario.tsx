import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EditorManualProprietario } from "@/components/empreendimentos/EditorManualProprietario";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ManualProprietario() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([]);
  const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpreendimentos();
    
    // Se veio com ID na URL
    const empId = searchParams.get("empreendimento");
    if (empId) {
      setSelectedEmpreendimento(empId);
    }
  }, [searchParams]);

  const loadEmpreendimentos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("empreendimentos")
        .select("id, nome, cidade, estado")
        .eq("construtora_id", user.id)
        .order("nome");

      if (error) throw error;

      setEmpreendimentos(data || []);

      // Se só tem um empreendimento, seleciona automaticamente
      if (data && data.length === 1) {
        setSelectedEmpreendimento(data[0].id);
      }
    } catch (error: any) {
      console.error("Erro ao carregar empreendimentos:", error);
      toast.error("Erro ao carregar empreendimentos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>

          {!selectedEmpreendimento ? (
            <div className="max-w-md mx-auto mt-12 space-y-4">
              <h2 className="text-2xl font-bold text-center">
                Selecione o Empreendimento
              </h2>
              <div>
                <Label htmlFor="empreendimento">Empreendimento</Label>
                <Select
                  value={selectedEmpreendimento}
                  onValueChange={setSelectedEmpreendimento}
                >
                  <SelectTrigger id="empreendimento">
                    <SelectValue placeholder="Selecione um empreendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {empreendimentos.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nome} - {emp.cidade}/{emp.estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <EditorManualProprietario empreendimentoId={selectedEmpreendimento} />
          )}
        </div>
      </main>
    </div>
  );
}
