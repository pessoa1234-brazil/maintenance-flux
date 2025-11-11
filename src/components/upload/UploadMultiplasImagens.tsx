import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";

interface UploadMultiplasImagensProps {
  bucket: string;
  path: string;
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
}

export const UploadMultiplasImagens = ({
  bucket,
  path,
  onUploadComplete,
  maxFiles = 10
}: UploadMultiplasImagensProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/jpeg"
    };

    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`Imagem comprimida: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error);
      return file;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} imagens permitidas`);
      return;
    }

    // Validar tipos de arquivo
    const validFiles = selectedFiles.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} não é uma imagem válida`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Criar previews
    const newPreviews = await Promise.all(
      validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    setPreviews(prev => [...prev, ...newPreviews]);
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos uma imagem");
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Comprimir imagem
        const compressedFile = await compressImage(file);
        
        // Gerar nome único
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}-${randomString}.jpg`;
        const filePath = `${path}/${fileName}`;

        // Upload para Supabase
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, compressedFile, {
            cacheControl: "3600",
            upsert: false
          });

        if (error) throw error;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      toast.success(`${uploadedUrls.length} imagens enviadas com sucesso!`);
      onUploadComplete(uploadedUrls);
      
      // Limpar estado
      setPreviews([]);
      setFiles([]);
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error.message || "Erro ao fazer upload das imagens");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={uploading || files.length >= maxFiles}
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Imagens
        </Button>
        
        {files.length > 0 && (
          <Button
            type="button"
            onClick={uploadFiles}
            disabled={uploading}
          >
            {uploading ? "Enviando..." : `Enviar ${files.length} ${files.length === 1 ? "Imagem" : "Imagens"}`}
          </Button>
        )}
        
        <span className="text-sm text-muted-foreground">
          {files.length}/{maxFiles}
        </span>
      </div>

      <input
        id="file-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <Card className="border-dashed border-2 p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Clique em "Selecionar Imagens" para adicionar fotos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            As imagens serão automaticamente comprimidas
          </p>
        </Card>
      )}
    </div>
  );
};
