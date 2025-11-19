import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CalendarioAgendamentos } from "@/components/scheduling/CalendarioAgendamentos";
import { ConfiguracaoPreAgendamentos } from "@/components/scheduling/ConfiguracaoPreAgendamentos";
import { RelatorioPreAgendamentos } from "@/components/scheduling/RelatorioPreAgendamentos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

const Scheduling = () => {
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
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
        
        <Tabs defaultValue="calendario" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="configuracao">Configuração</TabsTrigger>
            <TabsTrigger value="relatorio">Relatórios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendario" className="space-y-6">
            <CalendarioAgendamentos />
          </TabsContent>
          
          <TabsContent value="configuracao" className="space-y-6">
            <ConfiguracaoPreAgendamentos />
          </TabsContent>
          
          <TabsContent value="relatorio" className="space-y-6">
            <RelatorioPreAgendamentos />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Scheduling;
