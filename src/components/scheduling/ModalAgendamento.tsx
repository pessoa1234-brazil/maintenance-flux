import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock } from "lucide-react";

interface ModalAgendamentoProps {
  isOpen: boolean;
  onClose: () => void;
  dataSelecionada: Date;
  onSuccess: () => void;
}

export const ModalAgendamento = ({ isOpen, onClose, dataSelecionada, onSuccess }: ModalAgendamentoProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "manutencao_preventiva",
    titulo: "",
    descricao: "",
    hora_inicio: "09:00",
    hora_fim: "10:00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("empreendimento_id")
        .eq("id", user.id)
        .single();

      if (!profile?.empreendimento_id) {
        throw new Error("Você precisa estar vinculado a um empreendimento");
      }

      // Criar datas com horários
      const dataInicio = new Date(dataSelecionada);
      const [horaInicio, minutoInicio] = formData.hora_inicio.split(":");
      dataInicio.setHours(parseInt(horaInicio), parseInt(minutoInicio), 0);

      const dataFim = new Date(dataSelecionada);
      const [horaFim, minutoFim] = formData.hora_fim.split(":");
      dataFim.setHours(parseInt(horaFim), parseInt(minutoFim), 0);

      // Validar horários
      if (dataFim <= dataInicio) {
        throw new Error("Hora de término deve ser posterior à hora de início");
      }

      const { error } = await supabase.from("agendamentos").insert({
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        solicitante_id: user.id,
        prestador_id: user.id, // Mesmo usuário por enquanto
        status: "agendado",
      });

      if (error) throw error;

      toast.success("Agendamento criado com sucesso!");
      onSuccess();
      onClose();
      
      // Limpar formulário
      setFormData({
        tipo: "manutencao_preventiva",
        titulo: "",
        descricao: "",
        hora_inicio: "09:00",
        hora_fim: "10:00",
      });
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast.error(error.message || "Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Agende uma visita técnica ou manutenção preventiva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {dataSelecionada.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo de Agendamento</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manutencao_preventiva">Manutenção Preventiva</SelectItem>
                <SelectItem value="visita_tecnica">Visita Técnica</SelectItem>
                <SelectItem value="inspecao">Inspeção</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Revisão do sistema hidráulico"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva os detalhes do agendamento..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hora_inicio">Hora de Início *</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hora_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="hora_fim">Hora de Término *</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="hora_fim"
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                  className="pl-8"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
