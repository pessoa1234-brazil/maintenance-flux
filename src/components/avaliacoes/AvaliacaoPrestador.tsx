import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface AvaliacaoPrestadorProps {
  osId: string;
  prestadorId: string;
  prestadorNome: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AvaliacaoPrestador = ({
  osId,
  prestadorId,
  prestadorNome,
  isOpen,
  onClose,
  onSuccess
}: AvaliacaoPrestadorProps) => {
  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (nota === 0) {
      toast.error("Por favor, selecione uma nota");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("avaliacoes")
        .insert({
          os_id: osId,
          prestador_id: prestadorId,
          avaliador_id: user.id,
          nota,
          comentario: comentario.trim() || null
        });

      if (error) throw error;

      toast.success("Avaliação enviada com sucesso!");
      onSuccess();
      onClose();
      
      // Reset form
      setNota(0);
      setComentario("");
    } catch (error: any) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error(error.message || "Erro ao enviar avaliação");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Avaliar {prestadorNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <label className="text-sm font-medium mb-3 block text-center">
              Como você avalia o serviço prestado?
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNota(star)}
                  onMouseEnter={() => setHoverNota(star)}
                  onMouseLeave={() => setHoverNota(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverNota || nota)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {nota === 0 && "Selecione uma nota"}
              {nota === 1 && "Muito Insatisfeito"}
              {nota === 2 && "Insatisfeito"}
              {nota === 3 && "Regular"}
              {nota === 4 && "Satisfeito"}
              {nota === 5 && "Muito Satisfeito"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentário (opcional)
            </label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {comentario.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || nota === 0}
              className="flex-1"
            >
              {submitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
