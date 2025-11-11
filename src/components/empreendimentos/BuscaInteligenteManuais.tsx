import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, BookOpen, Loader2, FileText, History, Lightbulb } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface BuscaInteligenteManuaisProps {
  empreendimentoId: string;
}

const FAQ_SUGESTOES: Record<string, string[]> = {
  proprietario: [
    "Qual a área do terreno do empreendimento?",
    "Quantos elevadores o edifício possui?",
    "Qual a área média dos apartamentos?",
    "Quando foi a data de entrega do empreendimento?"
  ],
  condominio: [
    "Como funciona o sistema de aquecimento?",
    "Quais são as áreas comuns disponíveis?",
    "Qual a política de uso do salão de festas?",
    "Como funciona o sistema de segurança?"
  ],
  usuario: [
    "Como fazer manutenção preventiva do ar-condicionado?",
    "Qual a garantia do sistema elétrico?",
    "Como limpar as áreas externas?",
    "Onde estão localizados os registros de água?"
  ],
  todos: [
    "Qual a área do terreno?",
    "Como funciona o sistema de aquecimento?",
    "Qual a garantia do sistema elétrico?",
    "Quais áreas comuns estão disponíveis?"
  ]
};

export const BuscaInteligenteManuais = ({ empreendimentoId }: BuscaInteligenteManuaisProps) => {
  const [pergunta, setPergunta] = useState("");
  const [tipoManual, setTipoManual] = useState<string>("todos");
  const [resultado, setResultado] = useState<{
    resposta: string;
    referencias: string[];
    total_manuais_consultados: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<Array<{
    id: string;
    pergunta: string;
    resposta: string;
    tipo_manual: string | null;
    created_at: string;
  }>>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  useEffect(() => {
    carregarHistorico();
  }, [empreendimentoId]);

  const carregarHistorico = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return;

      const { data, error } = await supabase
        .from("historico_buscas_manuais")
        .select("*")
        .eq("empreendimento_id", empreendimentoId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setHistorico(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const handleBuscar = async () => {
    if (!pergunta.trim()) {
      toast.error("Digite uma pergunta para buscar");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const { data, error } = await supabase.functions.invoke("buscar-manual", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: {
          empreendimentoId,
          pergunta: pergunta.trim(),
          tipoManual: tipoManual === "todos" ? null : tipoManual,
        },
      });

      if (error) throw error;

      setResultado(data);
      await carregarHistorico(); // Recarregar histórico após busca
    } catch (error: any) {
      console.error("Erro ao buscar:", error);
      toast.error(error.message || "Erro ao realizar busca");
    } finally {
      setLoading(false);
    }
  };

  const usarSugestao = (sugestao: string) => {
    setPergunta(sugestao);
  };

  const usarHistorico = (item: typeof historico[0]) => {
    setPergunta(item.pergunta);
    setResultado({
      resposta: item.resposta,
      referencias: [],
      total_manuais_consultados: 0
    });
    setMostrarHistorico(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBuscar();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Busca Inteligente em Manuais
            </CardTitle>
            <CardDescription>
              Faça perguntas e encontre informações específicas nos manuais processados por IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tipo-manual">Buscar em:</Label>
            <Select value={tipoManual} onValueChange={setTipoManual}>
              <SelectTrigger id="tipo-manual">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os manuais</SelectItem>
                <SelectItem value="proprietario">Manual do Proprietário</SelectItem>
                <SelectItem value="condominio">Manual do Condomínio</SelectItem>
                <SelectItem value="usuario">Manual do Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ex: Qual a área do terreno? Como funciona o sistema de aquecimento?"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Button onClick={handleBuscar} disabled={loading || !pergunta.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Analisando manuais com IA...
                </p>
              </div>
            </div>
          )}

          {resultado && !loading && (
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Resultado da Busca</CardTitle>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {resultado.referencias.map((ref) => (
                      <Badge key={ref} variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardDescription>
                  {resultado.total_manuais_consultados} manual(is) consultado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {resultado.resposta}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Sugestões de Perguntas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4" />
                Perguntas Sugeridas
              </CardTitle>
              <CardDescription>
                Clique em uma sugestão para usar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {FAQ_SUGESTOES[tipoManual].map((sugestao, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => usarSugestao(sugestao)}
                  >
                    <span className="text-sm">{sugestao}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Buscas */}
          {historico.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    Histórico de Buscas
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMostrarHistorico(!mostrarHistorico)}
                  >
                    {mostrarHistorico ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
                <CardDescription>
                  Suas últimas {historico.length} buscas
                </CardDescription>
              </CardHeader>
              {mostrarHistorico && (
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {historico.map((item, index) => (
                        <div key={item.id}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-3 px-4"
                            onClick={() => usarHistorico(item)}
                          >
                            <div className="space-y-1 w-full">
                              <p className="text-sm font-medium">{item.pergunta}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                                {item.tipo_manual && ` • ${item.tipo_manual}`}
                              </p>
                            </div>
                          </Button>
                          {index < historico.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium">💡 Dicas para melhores resultados:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Faça perguntas específicas e objetivas</li>
              <li>Use termos técnicos quando apropriado</li>
              <li>Exemplos: "Qual a garantia do sistema elétrico?", "Como fazer manutenção preventiva?"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};