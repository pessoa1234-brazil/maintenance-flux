import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Camera, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConclusaoServicoProps {
  osId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ConclusaoServico = ({ osId, onSuccess, onCancel }: ConclusaoServicoProps) => {
  const [loading, setLoading] = useState(false);
  const [fotosAntes, setFotosAntes] = useState<File[]>([]);
  const [fotosDepois, setFotosDepois] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    descricao_trabalho: "",
    materiais_utilizados: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, tipo: "antes" | "depois") => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (tipo === "antes") {
        setFotosAntes(prev => [...prev, ...newFiles]);
      } else {
        setFotosDepois(prev => [...prev, ...newFiles]);
      }
    }
  };

  const removePhoto = (index: number, tipo: "antes" | "depois") => {
    if (tipo === "antes") {
      setFotosAntes(prev => prev.filter((_, i) => i !== index));
    } else {
      setFotosDepois(prev => prev.filter((_, i) => i !== index));
    }
  };

  const uploadFotos = async (files: File[], osId: string, prefixo: string): Promise<string[]> => {
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${osId}/${prefixo}_${Date.now()}_${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("empreendimentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("empreendimentos")
        .getPublicUrl(fileName);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações obrigatórias
    if (fotosAntes.length === 0) {
      toast.error("É obrigatório enviar fotos do estado ANTES do serviço");
      return;
    }

    if (fotosDepois.length === 0) {
      toast.error("É obrigatório enviar fotos do estado DEPOIS do serviço");
      return;
    }

    if (!formData.descricao_trabalho.trim()) {
      toast.error("A descrição do trabalho realizado é obrigatória");
      return;
    }

    if (!formData.materiais_utilizados.trim()) {
      toast.error("É obrigatório informar os materiais utilizados");
      return;
    }

    setLoading(true);

    try {
      // Upload das fotos
      const urlsAntes = await uploadFotos(fotosAntes, osId, "antes");
      const urlsDepois = await uploadFotos(fotosDepois, osId, "depois");

      // Atualizar OS
      const { error: updateError } = await supabase
        .from("ordens_servico")
        .update({
          fotos_antes: urlsAntes,
          fotos_depois: urlsDepois,
          descricao_trabalho_realizado: formData.descricao_trabalho,
          materiais_utilizados: formData.materiais_utilizados,
          status: "CONCLUIDA" as any,
          data_conclusao: new Date().toISOString(),
        })
        .eq("id", osId);

      if (updateError) throw updateError;

      toast.success("Serviço concluído com sucesso! Documentação enviada.");
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao concluir serviço:", error);
      toast.error(error.message || "Erro ao concluir serviço");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-1">Documentação Obrigatória NBR 5674</p>
          <p className="text-sm">
            Para preservar a garantia do empreendimento, é obrigatório enviar fotos antes e depois,
            descrição detalhada do trabalho e materiais utilizados.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Fotos ANTES do Serviço *
          </CardTitle>
          <CardDescription>
            Registre o estado inicial do problema (mínimo 1 foto)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fotos-antes" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar fotos ou arraste aqui
                </p>
              </div>
            </Label>
            <Input
              id="fotos-antes"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "antes")}
              className="hidden"
            />
          </div>

          {fotosAntes.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {fotosAntes.map((foto, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(foto)}
                    alt={`Antes ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index, "antes")}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Fotos DEPOIS do Serviço *
          </CardTitle>
          <CardDescription>
            Registre o trabalho finalizado (mínimo 1 foto)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fotos-depois" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar fotos ou arraste aqui
                </p>
              </div>
            </Label>
            <Input
              id="fotos-depois"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "depois")}
              className="hidden"
            />
          </div>

          {fotosDepois.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {fotosDepois.map((foto, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(foto)}
                    alt={`Depois ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index, "depois")}
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

      <Card>
        <CardHeader>
          <CardTitle>Descrição do Trabalho Realizado *</CardTitle>
          <CardDescription>
            Descreva detalhadamente os serviços executados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.descricao_trabalho}
            onChange={(e) => setFormData({ ...formData, descricao_trabalho: e.target.value })}
            placeholder="Ex: Substituição de válvula de descarga, reparo de vazamento na tubulação..."
            rows={5}
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Materiais Utilizados *</CardTitle>
          <CardDescription>
            Liste todos os materiais e suas especificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.materiais_utilizados}
            onChange={(e) => setFormData({ ...formData, materiais_utilizados: e.target.value })}
            placeholder="Ex: Válvula de descarga Docol, Tubo PVC 25mm, Vedante Veda Calha..."
            rows={4}
            required
          />
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Finalizando..." : "Concluir Serviço"}
        </Button>
      </div>
    </form>
  );
};
