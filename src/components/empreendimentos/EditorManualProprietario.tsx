import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Plus, Save, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ManualSection {
  id: string;
  secao: string;
  subsecao: string | null;
  ordem: number;
  titulo: string;
  conteudo: string;
  tipo_conteudo: string;
  dados_estruturados: any;
  editavel: boolean;
  visivel: boolean;
}

interface Template {
  id: string;
  secao: string;
  subsecao: string | null;
  ordem: number;
  titulo: string;
  descricao: string;
  conteudo_padrao: string | null;
  tipo_conteudo: string;
  obrigatorio: boolean;
}

interface EditorManualProprietarioProps {
  empreendimentoId: string;
}

export const EditorManualProprietario = ({ empreendimentoId }: EditorManualProprietarioProps) => {
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<ManualSection | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    secao: "",
    subsecao: "",
    titulo: "",
    conteudo: "",
    tipo_conteudo: "texto",
    dados_estruturados: null as any,
  });

  useEffect(() => {
    loadData();
  }, [empreendimentoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar seções existentes
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("manual_proprietario_conteudo")
        .select("*")
        .eq("empreendimento_id", empreendimentoId)
        .order("secao", { ascending: true })
        .order("ordem", { ascending: true });

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // Carregar templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("manual_proprietario_templates")
        .select("*")
        .order("secao", { ascending: true })
        .order("ordem", { ascending: true });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do manual");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template: Template) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("manual_proprietario_conteudo")
        .insert({
          empreendimento_id: empreendimentoId,
          secao: template.secao,
          subsecao: template.subsecao,
          ordem: template.ordem,
          titulo: template.titulo,
          conteudo: template.conteudo_padrao || "",
          tipo_conteudo: template.tipo_conteudo,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Seção criada com sucesso!");
      loadData();
    } catch (error: any) {
      console.error("Erro ao criar seção:", error);
      toast.error("Erro ao criar seção");
    }
  };

  const handleSaveSection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (selectedSection) {
        // Atualizar seção existente
        const { error } = await supabase
          .from("manual_proprietario_conteudo")
          .update({
            titulo: formData.titulo,
            conteudo: formData.conteudo,
            tipo_conteudo: formData.tipo_conteudo,
            dados_estruturados: formData.dados_estruturados,
            updated_by: user.id,
          })
          .eq("id", selectedSection.id);

        if (error) throw error;
        toast.success("Seção atualizada com sucesso!");
      } else {
        // Criar nova seção
        const { error } = await supabase
          .from("manual_proprietario_conteudo")
          .insert({
            empreendimento_id: empreendimentoId,
            secao: formData.secao,
            subsecao: formData.subsecao || null,
            ordem: sections.length + 1,
            titulo: formData.titulo,
            conteudo: formData.conteudo,
            tipo_conteudo: formData.tipo_conteudo,
            dados_estruturados: formData.dados_estruturados,
            created_by: user.id,
            updated_by: user.id,
          });

        if (error) throw error;
        toast.success("Seção criada com sucesso!");
      }

      setEditMode(false);
      setSelectedSection(null);
      setFormData({
        secao: "",
        subsecao: "",
        titulo: "",
        conteudo: "",
        tipo_conteudo: "texto",
        dados_estruturados: null,
      });
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar seção:", error);
      toast.error("Erro ao salvar seção");
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta seção?")) return;

    try {
      const { error } = await supabase
        .from("manual_proprietario_conteudo")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Seção excluída com sucesso!");
      loadData();
    } catch (error: any) {
      console.error("Erro ao excluir seção:", error);
      toast.error("Erro ao excluir seção");
    }
  };

  const handleToggleVisibility = async (section: ManualSection) => {
    try {
      const { error } = await supabase
        .from("manual_proprietario_conteudo")
        .update({ visivel: !section.visivel })
        .eq("id", section.id);

      if (error) throw error;

      toast.success("Visibilidade alterada!");
      loadData();
    } catch (error: any) {
      console.error("Erro ao alterar visibilidade:", error);
      toast.error("Erro ao alterar visibilidade");
    }
  };

  const handleEditSection = (section: ManualSection) => {
    setSelectedSection(section);
    setFormData({
      secao: section.secao,
      subsecao: section.subsecao || "",
      titulo: section.titulo,
      conteudo: section.conteudo,
      tipo_conteudo: section.tipo_conteudo,
      dados_estruturados: section.dados_estruturados,
    });
    setEditMode(true);
  };

  const groupedSections = sections.reduce((acc, section) => {
    if (!acc[section.secao]) {
      acc[section.secao] = [];
    }
    acc[section.secao].push(section);
    return acc;
  }, {} as Record<string, ManualSection[]>);

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.secao]) {
      acc[template.secao] = [];
    }
    acc[template.secao].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  if (loading) {
    return <div className="p-8 text-center">Carregando manual...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Manual do Proprietário</h2>
          <p className="text-muted-foreground">
            Elabore o manual seguindo a estrutura NBR 14037
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedSection(null);
            setEditMode(true);
            setFormData({
              secao: "",
              subsecao: "",
              titulo: "",
              conteudo: "",
              tipo_conteudo: "texto",
              dados_estruturados: null,
            });
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Seção
        </Button>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preview">Visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {editMode ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedSection ? "Editar Seção" : "Nova Seção"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="secao">Seção *</Label>
                    <Input
                      id="secao"
                      value={formData.secao}
                      onChange={(e) =>
                        setFormData({ ...formData, secao: e.target.value })
                      }
                      placeholder="Ex: 1, 2, 3..."
                      disabled={!!selectedSection}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subsecao">Subseção</Label>
                    <Input
                      id="subsecao"
                      value={formData.subsecao}
                      onChange={(e) =>
                        setFormData({ ...formData, subsecao: e.target.value })
                      }
                      placeholder="Ex: 1.1, 2.3..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="tipo_conteudo">Tipo de Conteúdo</Label>
                  <Select
                    value={formData.tipo_conteudo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo_conteudo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="lista">Lista</SelectItem>
                      <SelectItem value="tabela">Tabela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="conteudo">Conteúdo *</Label>
                  <Textarea
                    id="conteudo"
                    value={formData.conteudo}
                    onChange={(e) =>
                      setFormData({ ...formData, conteudo: e.target.value })
                    }
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Digite o conteúdo da seção..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporte a formatação HTML básica
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSection}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setSelectedSection(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.keys(groupedSections).sort().map((secaoKey) => (
                <Card key={secaoKey}>
                  <CardHeader>
                    <CardTitle>Seção {secaoKey}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {groupedSections[secaoKey].map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">
                              {section.subsecao && `${section.subsecao} - `}
                              {section.titulo}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {section.tipo_conteudo}
                            </Badge>
                            {!section.visivel && (
                              <Badge variant="secondary" className="text-xs">
                                Oculto
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleVisibility(section)}
                          >
                            {section.visivel ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSection(section)}
                          >
                            Editar
                          </Button>
                          {section.editavel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSection(section.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates Disponíveis</CardTitle>
              <CardDescription>
                Clique para adicionar seções padrão ao manual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(groupedTemplates).sort().map((secaoKey) => (
                <div key={secaoKey} className="space-y-2">
                  <h3 className="font-semibold">Seção {secaoKey}</h3>
                  {groupedTemplates[secaoKey].map((template) => {
                    const exists = sections.some(
                      (s) =>
                        s.secao === template.secao &&
                        s.subsecao === template.subsecao &&
                        s.titulo === template.titulo
                    );

                    return (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{template.titulo}</span>
                            {template.obrigatorio && (
                              <Badge variant="destructive" className="text-xs">
                                Obrigatório
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {template.tipo_conteudo}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {template.descricao}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCreateFromTemplate(template)}
                          disabled={exists}
                        >
                          {exists ? "Adicionado" : "Adicionar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualização do Manual</CardTitle>
              <CardDescription>
                Prévia de como o manual será apresentado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.keys(groupedSections).sort().map((secaoKey) => (
                <div key={secaoKey} className="space-y-4">
                  <h2 className="text-2xl font-bold border-b pb-2">
                    Seção {secaoKey}
                  </h2>
                  {groupedSections[secaoKey]
                    .filter((s) => s.visivel)
                    .map((section) => (
                      <div key={section.id} className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          {section.subsecao && `${section.subsecao} - `}
                          {section.titulo}
                        </h3>
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: section.conteudo }}
                        />
                      </div>
                    ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
