import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormularioEmpreendimentoProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const FormularioEmpreendimento = ({ onSuccess, onCancel }: FormularioEmpreendimentoProps) => {
  const [loading, setLoading] = useState(false);
  const [fotos, setFotos] = useState<File[]>([]);
  const [manualProprietario, setManualProprietario] = useState<File | null>(null);
  const [manualCondominio, setManualCondominio] = useState<File | null>(null);
  const [manualUsuario, setManualUsuario] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    area_terreno: "",
    numero_andares: "",
    numero_elevadores: "",
    numero_apartamentos: "",
    area_media_apartamentos: "",
    total_unidades: "",
    data_entrega: "",
    data_habite_se: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFotos(prev => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadManual = async (file: File, tipo: string, empreendimentoId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${empreendimentoId}/${tipo}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from("manuais")
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("manuais")
      .getPublicUrl(fileName);

    // Processar documento com IA
    await supabase.functions.invoke('processar-manual', {
      body: {
        empreendimentoId,
        tipoManual: tipo,
        arquivoUrl: publicUrl
      }
    });

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Inserir empreendimento
      const { data: empreendimento, error: insertError } = await supabase
        .from("empreendimentos")
        .insert({
          construtora_id: user.id,
          nome: formData.nome,
          endereco: formData.endereco,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep,
          area_terreno: formData.area_terreno ? parseFloat(formData.area_terreno) : null,
          numero_andares: formData.numero_andares ? parseInt(formData.numero_andares) : null,
          numero_elevadores: formData.numero_elevadores ? parseInt(formData.numero_elevadores) : null,
          numero_apartamentos: formData.numero_apartamentos ? parseInt(formData.numero_apartamentos) : null,
          area_media_apartamentos: formData.area_media_apartamentos ? parseFloat(formData.area_media_apartamentos) : null,
          total_unidades: formData.total_unidades ? parseInt(formData.total_unidades) : 0,
          data_entrega: formData.data_entrega,
          data_habite_se: formData.data_habite_se || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload de manuais
      const manualUrls: any = {};
      
      if (manualProprietario) {
        toast.info("Processando Manual do Proprietário...");
        manualUrls.manual_proprietario_url = await uploadManual(manualProprietario, 'proprietario', empreendimento.id);
      }
      
      if (manualCondominio) {
        toast.info("Processando Manual do Condomínio...");
        manualUrls.manual_condominio_url = await uploadManual(manualCondominio, 'condominio', empreendimento.id);
      }
      
      if (manualUsuario) {
        toast.info("Processando Manual do Usuário...");
        manualUrls.manual_usuario_url = await uploadManual(manualUsuario, 'usuario', empreendimento.id);
      }

      // Atualizar empreendimento com URLs dos manuais
      if (Object.keys(manualUrls).length > 0) {
        const { error: updateError } = await supabase
          .from("empreendimentos")
          .update(manualUrls)
          .eq('id', empreendimento.id);

        if (updateError) throw updateError;
      }

      // Upload de fotos
      if (fotos.length > 0) {
        const uploadPromises = fotos.map(async (foto, index) => {
          const fileExt = foto.name.split('.').pop();
          const fileName = `${empreendimento.id}/${Date.now()}_${index}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("empreendimentos")
            .upload(fileName, foto);
          
          if (uploadError) throw uploadError;
        });

        await Promise.all(uploadPromises);
      }

      toast.success("Empreendimento cadastrado com sucesso! Os manuais estão sendo processados pela IA.");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar empreendimento:", error);
      toast.error(error.message || "Erro ao cadastrar empreendimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados gerais do empreendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Empreendimento *</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Especificações Técnicas</CardTitle>
          <CardDescription>Detalhes técnicos do empreendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="area_terreno">Área do Terreno (m²)</Label>
              <Input
                id="area_terreno"
                name="area_terreno"
                type="number"
                step="0.01"
                value={formData.area_terreno}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="numero_andares">Número de Andares</Label>
              <Input
                id="numero_andares"
                name="numero_andares"
                type="number"
                value={formData.numero_andares}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="numero_elevadores">Elevadores</Label>
              <Input
                id="numero_elevadores"
                name="numero_elevadores"
                type="number"
                value={formData.numero_elevadores}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="numero_apartamentos">Apartamentos</Label>
              <Input
                id="numero_apartamentos"
                name="numero_apartamentos"
                type="number"
                value={formData.numero_apartamentos}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="area_media_apartamentos">Área Média Apt. (m²)</Label>
              <Input
                id="area_media_apartamentos"
                name="area_media_apartamentos"
                type="number"
                step="0.01"
                value={formData.area_media_apartamentos}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_unidades">Total de Unidades *</Label>
              <Input
                id="total_unidades"
                name="total_unidades"
                type="number"
                value={formData.total_unidades}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="data_entrega">Data de Entrega *</Label>
              <Input
                id="data_entrega"
                name="data_entrega"
                type="date"
                value={formData.data_entrega}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="data_habite_se">Data do Habite-se</Label>
              <Input
                id="data_habite_se"
                name="data_habite_se"
                type="date"
                value={formData.data_habite_se}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manuais</CardTitle>
          <CardDescription>Upload de arquivos PDF ou Word dos manuais (serão processados por IA)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="manual_proprietario">Manual do Proprietário</Label>
            <Input
              id="manual_proprietario"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setManualProprietario(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {manualProprietario && (
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo selecionado: {manualProprietario.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="manual_condominio">Manual do Condomínio</Label>
            <Input
              id="manual_condominio"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setManualCondominio(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {manualCondominio && (
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo selecionado: {manualCondominio.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="manual_usuario">Manual do Usuário</Label>
            <Input
              id="manual_usuario"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setManualUsuario(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {manualUsuario && (
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo selecionado: {manualUsuario.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fotos</CardTitle>
          <CardDescription>Upload de fotos do empreendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fotos" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar fotos ou arraste aqui
                </p>
              </div>
            </Label>
            <Input
              id="fotos"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {fotos.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {fotos.map((foto, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(foto)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Cadastrar Empreendimento"}
        </Button>
      </div>
    </form>
  );
};
