import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FormularioOS } from "@/components/servicos/FormularioOS";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NovaOS = () => {
  const navigate = useNavigate();
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Nova Ordem de Serviço</h1>
            <p className="text-muted-foreground">
              Solicite um serviço classificando conforme NBR 17170:2022 e NBR 5674
            </p>
          </div>
          
          <FormularioOS onSuccess={() => navigate("/")} onCancel={() => navigate("/")} />
        </div>
      </div>
    </div>
  );
};

export default NovaOS;
