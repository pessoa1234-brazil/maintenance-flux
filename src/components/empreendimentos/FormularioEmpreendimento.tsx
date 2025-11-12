import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { empreendimentoSchema } from "@/lib/validation";

interface FormularioEmpreendimentoProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  isDuplicating?: boolean;
}

export const FormularioEmpreendimento = ({ onSuccess, onCancel, initialData, isDuplicating }: FormularioEmpreendimentoProps) => {
  const [loading, setLoading] = useState(false);
  const [fotos, setFotos] = useState<File[]>([]);
  const [manualProprietario, setManualProprietario] = useState<File | null>(null);
  const [manualCondominio, setManualCondominio] = useState<File | null>(null);
  const [manualUsuario, setManualUsuario] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nome: initialData?.nome ? `${initialData.nome} (Cópia)` : "",
    endereco: initialData?.endereco || "",
    cidade: initialData?.cidade || "",
    estado: initialData?.estado || "",
    cep: initialData?.cep || "",
    tipo_empreendimento: initialData?.tipo_empreendimento || "condominio",
    area_terreno: initialData?.area_terreno?.toString() || "",
    numero_andares: initialData?.numero_andares?.toString() || "",
    numero_elevadores: initialData?.numero_elevadores?.toString() || "",
    numero_apartamentos: initialData?.numero_apartamentos?.toString() || "",
    area_media_apartamentos: initialData?.area_media_apartamentos?.toString() || "",
    total_unidades: initialData?.total_unidades?.toString() || "",
    data_entrega: initialData?.data_entrega || "",
    data_habite_se: initialData?.data_habite_se || "",
  });

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const validateField = (name: string, value: string) => {
    try {
      const fieldSchema = empreendimentoSchema.shape[name as keyof typeof empreendimentoSchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value === "" ? undefined : value);
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } catch (error: any) {
      if (error.errors?.[0]?.message) {
        setFieldErrors(prev => ({ ...prev, [name]: error.errors[0].message }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Apply CEP mask
    if (name === 'cep') {
      formattedValue = formatCEP(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Validate field in real-time
    validateField(name, formattedValue);
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

      // Prepare data for validation - exclude condominium fields for non-condominium projects
      const dataToValidate = { ...formData };
      if (formData.tipo_empreendimento === "nao_condominio") {
        dataToValidate.numero_andares = "";
        dataToValidate.numero_elevadores = "";
        dataToValidate.numero_apartamentos = "";
        dataToValidate.area_media_apartamentos = "";
      }

      // Validate form data with zod
      const validationResult = empreendimentoSchema.safeParse(dataToValidate);
      
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(err => err.message).join("; ");
        throw new Error(errorMessages);
      }

      const validatedData = validationResult.data;

      // Inserir empreendimento
      const { data: empreendimento, error: insertError } = await supabase
        .from("empreendimentos")
        .insert({
          construtora_id: user.id,
          nome: validatedData.nome,
          endereco: validatedData.endereco,
          cidade: validatedData.cidade,
          estado: validatedData.estado,
          cep: validatedData.cep,
          tipo_empreendimento: formData.tipo_empreendimento,
          area_terreno: validatedData.area_terreno ?? null,
          numero_andares: validatedData.numero_andares ?? null,
          numero_elevadores: validatedData.numero_elevadores ?? null,
          numero_apartamentos: validatedData.numero_apartamentos ?? null,
          area_media_apartamentos: validatedData.area_media_apartamentos ?? null,
          total_unidades: validatedData.total_unidades,
          data_entrega: validatedData.data_entrega,
          data_habite_se: validatedData.data_habite_se || null,
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

      toast.success(isDuplicating ? "Empreendimento duplicado com sucesso!" : "Empreendimento cadastrado com sucesso! Os manuais estão sendo processados pela IA.");
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
              className={fieldErrors.nome ? "border-destructive" : ""}
            />
            {fieldErrors.nome && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.nome}</p>
            )}
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
                className={fieldErrors.endereco ? "border-destructive" : ""}
              />
              {fieldErrors.endereco && (
                <p className="text-sm text-destructive mt-1">{fieldErrors.endereco}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleInputChange}
                placeholder="00000-000"
                maxLength={9}
                required
                className={fieldErrors.cep ? "border-destructive" : ""}
              />
              {fieldErrors.cep && (
                <p className="text-sm text-destructive mt-1">{fieldErrors.cep}</p>
              )}
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
                className={fieldErrors.cidade ? "border-destructive" : ""}
              />
              {fieldErrors.cidade && (
                <p className="text-sm text-destructive mt-1">{fieldErrors.cidade}</p>
              )}
            </div>
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                placeholder="Ex: SP"
                maxLength={2}
                required
                className={fieldErrors.estado ? "border-destructive" : ""}
              />
              {fieldErrors.estado && (
                <p className="text-sm text-destructive mt-1">{fieldErrors.estado}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="tipo_empreendimento">Tipo de Empreendimento *</Label>
            <Select
              value={formData.tipo_empreendimento}
              onValueChange={(value) => setFormData({ ...formData, tipo_empreendimento: value })}
            >
              <SelectTrigger id="tipo_empreendimento">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="condominio">Empreendimento - Condomínio</SelectItem>
                <SelectItem value="nao_condominio">Empreendimento - Não Condominial</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {formData.tipo_empreendimento === "condominio" 
                ? "Permite cadastramento de múltiplas unidades"
                : "O próprio empreendimento funciona como unidade única"}
            </p>
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
            {formData.tipo_empreendimento === "condominio" && (
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
            )}
          </div>

          {formData.tipo_empreendimento === "condominio" && (
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
          )}

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
                className={fieldErrors.total_unidades ? "border-destructive" : ""}
              />
              {fieldErrors.total_unidades && (
                <p className="text-sm text-destructive mt-1">{fieldErrors.total_unidades}</p>
              )}
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
                className={fieldErrors.data_entrega ? "border-destructive" : ""}
              />
              {fieldErrors.data_entrega && (
                <p className="text-sm text-destructive mt-1">{fieldErrors.data_entrega}</p>
              )}
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
          {loading ? "Salvando..." : isDuplicating ? "Duplicar Empreendimento" : "Cadastrar Empreendimento"}
        </Button>
      </div>
    </form>
  );
};
