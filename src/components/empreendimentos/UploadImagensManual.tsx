import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";

interface UploadImagensManualProps {
  sectionId: string;
  empreendimentoId: string;
  imagens: string[];
  onImagensUpdated: () => void;
}

export const UploadImagensManual = ({
  sectionId,
  empreendimentoId,
  imagens,
  onImagensUpdated,
}: UploadImagensManualProps) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Comprimir imagem
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        // Upload para storage
        const fileName = `${empreendimentoId}/${sectionId}/${Date.now()}_${i}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("manual-proprietario-imagens")
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from("manual-proprietario-imagens")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Atualizar seção com novas imagens
      const novasImagens = [...imagens, ...uploadedUrls];
      const { error: updateError } = await supabase
        .from("manual_proprietario_conteudo")
        .update({ imagens: novasImagens })
        .eq("id", sectionId);

      if (updateError) throw updateError;

      toast.success(`${files.length} imagem(ns) adicionada(s) com sucesso!`);
      onImagensUpdated();
    } catch (error: any) {
      console.error("Erro ao fazer upload de imagens:", error);
      toast.error("Erro ao fazer upload de imagens");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Remover do array
      const novasImagens = imagens.filter((img) => img !== imageUrl);

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from("manual_proprietario_conteudo")
        .update({ imagens: novasImagens })
        .eq("id", sectionId);

      if (updateError) throw updateError;

      // Tentar deletar do storage
      try {
        const urlParts = imageUrl.split("/");
        const fileName = urlParts.slice(-3).join("/"); // empreendimento/secao/arquivo
        await supabase.storage
          .from("manual-proprietario-imagens")
          .remove([fileName]);
      } catch (storageError) {
        console.warn("Erro ao deletar arquivo do storage:", storageError);
      }

      toast.success("Imagem removida com sucesso!");
      onImagensUpdated();
    } catch (error: any) {
      console.error("Erro ao remover imagem:", error);
      toast.error("Erro ao remover imagem");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`upload-${sectionId}`} className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Imagens da Seção
        </Label>
        <div className="mt-2">
          <Input
            id={`upload-${sectionId}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            multiple
            onChange={handleImageUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Formatos aceitos: JPG, PNG, WebP, SVG. Máximo 5MB por imagem.
          </p>
        </div>
      </div>

      {imagens && imagens.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imagens.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Imagem ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(imageUrl)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="w-4 h-4 animate-pulse" />
          Fazendo upload de imagens...
        </div>
      )}
    </div>
  );
};
