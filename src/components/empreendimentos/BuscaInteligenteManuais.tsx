import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, BookOpen, Loader2, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface BuscaInteligenteManuaisProps {
  empreendimentoId: string;
}

export const BuscaInteligenteManuais = ({ empreendimentoId }: BuscaInteligenteManuaisProps) => {
  const [pergunta, setPergunta] = useState("");
  const [tipoManual, setTipoManual] = useState<string>("todos");
  const [resultado, setResultado] = useState<{
    resposta: string;
    referencias: string[];
    total_manuais_consultados: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuscar = async () => {
    if (!pergunta.trim()) {
      toast.error("Digite uma pergunta para buscar");
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke("buscar-manual", {
        body: {
          empreendimentoId,
          pergunta: pergunta.trim(),
          tipoManual: tipoManual === "todos" ? null : tipoManual,
        },
      });

      if (error) throw error;

      setResultado(data);
    } catch (error: any) {
      console.error("Erro ao buscar:", error);
      toast.error(error.message || "Erro ao realizar busca");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBuscar();
    }
  };

  return (
    <div className="space-y-4">
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