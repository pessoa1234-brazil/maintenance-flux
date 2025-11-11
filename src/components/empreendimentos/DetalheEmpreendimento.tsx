import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EspecificacoesTecnicas } from "./EspecificacoesTecnicas";
import { BuscaInteligenteManuais } from "./BuscaInteligenteManuais";

interface EmpreendimentoDetalhado {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  area_terreno: number | null;
  numero_andares: number | null;
  numero_elevadores: number | null;
  numero_apartamentos: number | null;
  area_media_apartamentos: number | null;
  total_unidades: number;
  data_entrega: string;
  data_habite_se: string | null;
  manual_proprietario: string | null;
  manual_condominio: string | null;
  manual_usuario: string | null;
}

interface DetalheEmpreendimentoProps {
  id: string;
  onVoltar: () => void;
}

export const DetalheEmpreendimento = ({ id, onVoltar }: DetalheEmpreendimentoProps) => {
  const [empreendimento, setEmpreendimento] = useState<EmpreendimentoDetalhado | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      // Carregar empreendimento
      const { data: empData, error: empError } = await supabase
        .from("empreendimentos")
        .select("*")
        .eq("id", id)
        .single();

      if (empError) throw empError;
      setEmpreendimento(empData);

      // Carregar fotos
      const { data: fotosData } = await supabase.storage
        .from("empreendimentos")
        .list(id);

      if (fotosData) {
        const urls = fotosData.map((foto) => {
          const { data } = supabase.storage
            .from("empreendimentos")
            .getPublicUrl(`${id}/${foto.name}`);
          return data.publicUrl;
        });
        setFotos(urls);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!empreendimento) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Empreendimento não encontrado</p>
        <Button onClick={onVoltar} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onVoltar}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">{empreendimento.nome}</h2>
          <p className="text-muted-foreground">
            {empreendimento.endereco}, {empreendimento.cidade} - {empreendimento.estado}
          </p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral" className="gap-2">
            <Building2 className="h-4 w-4" />
            Informações Gerais
          </TabsTrigger>
          <TabsTrigger value="manuais" className="gap-2">
            <FileText className="h-4 w-4" />
            Manuais
          </TabsTrigger>
          <TabsTrigger value="especificacoes" className="gap-2">
            <Search className="h-4 w-4" />
            Especificações Técnicas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          {fotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fotos.map((foto, index) => (
                    <img
                      key={index}
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{empreendimento.endereco}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade</p>
                    <p className="font-medium">{empreendimento.cidade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium">{empreendimento.estado}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p className="font-medium">{empreendimento.cep}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Especificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Unidades</span>
                  <Badge>{empreendimento.total_unidades}</Badge>
                </div>
                {empreendimento.area_terreno && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Área do Terreno</span>
                    <Badge variant="outline">{empreendimento.area_terreno} m²</Badge>
                  </div>
                )}
                {empreendimento.numero_andares && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Andares</span>
                    <Badge variant="outline">{empreendimento.numero_andares}</Badge>
                  </div>
                )}
                {empreendimento.numero_elevadores && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Elevadores</span>
                    <Badge variant="outline">{empreendimento.numero_elevadores}</Badge>
                  </div>
                )}
                {empreendimento.numero_apartamentos && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Apartamentos</span>
                    <Badge variant="outline">{empreendimento.numero_apartamentos}</Badge>
                  </div>
                )}
                {empreendimento.area_media_apartamentos && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Área Média Apt.</span>
                    <Badge variant="outline">{empreendimento.area_media_apartamentos} m²</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Entrega</p>
                  <p className="font-medium">
                    {new Date(empreendimento.data_entrega).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {empreendimento.data_habite_se && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data do Habite-se</p>
                    <p className="font-medium">
                      {new Date(empreendimento.data_habite_se).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manuais" className="space-y-6">
          <BuscaInteligenteManuais empreendimentoId={id} />

          {empreendimento.manual_proprietario && (
            <Card>
              <CardHeader>
                <CardTitle>Manual do Proprietário</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{empreendimento.manual_proprietario}</p>
              </CardContent>
            </Card>
          )}

          {empreendimento.manual_condominio && (
            <Card>
              <CardHeader>
                <CardTitle>Manual do Condomínio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{empreendimento.manual_condominio}</p>
              </CardContent>
            </Card>
          )}

          {empreendimento.manual_usuario && (
            <Card>
              <CardHeader>
                <CardTitle>Manual do Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{empreendimento.manual_usuario}</p>
              </CardContent>
            </Card>
          )}

          {!empreendimento.manual_proprietario &&
            !empreendimento.manual_condominio &&
            !empreendimento.manual_usuario && (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum manual cadastrado</p>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="especificacoes">
          <EspecificacoesTecnicas empreendimentoId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
