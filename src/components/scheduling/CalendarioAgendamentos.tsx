import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Agendamento {
  id: string;
  titulo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  tipo: string;
}

export const CalendarioAgendamentos = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data: "",
    hora_inicio: "",
    hora_fim: "",
    tipo: "visita_tecnica"
  });

  useEffect(() => {
    loadAgendamentos();
  }, [selectedDate]);

  const loadAgendamentos = async () => {
    if (!selectedDate) return;

    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("data_inicio", startOfDay.toISOString())
        .lte("data_inicio", endOfDay.toISOString())
        .order("data_inicio", { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    }
  };

  const handleCreateAgendamento = async () => {
    if (!formData.titulo || !formData.data || !formData.hora_inicio || !formData.hora_fim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const dataInicio = new Date(`${formData.data}T${formData.hora_inicio}`);
      const dataFim = new Date(`${formData.data}T${formData.hora_fim}`);

      const { error } = await supabase
        .from("agendamentos")
        .insert({
          titulo: formData.titulo,
          descricao: formData.descricao,
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          tipo: formData.tipo,
          prestador_id: user.id,
          solicitante_id: user.id
        });

      if (error) throw error;

      toast.success("Agendamento criado com sucesso!");
      setIsModalOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        data: "",
        hora_inicio: "",
        hora_fim: "",
        tipo: "visita_tecnica"
      });
      loadAgendamentos();
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado": return "bg-green-500";
      case "cancelado": return "bg-red-500";
      case "concluido": return "bg-blue-500";
      default: return "bg-yellow-500";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "manutencao_preventiva": return "Manutenção Preventiva";
      case "visita_tecnica": return "Visita Técnica";
      case "inspecao": return "Inspeção";
      default: return "Outro";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Calendário de Agendamentos</h2>
          <p className="text-muted-foreground">Gerencie manutenções preventivas e visitas técnicas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Selecione uma Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Agendamentos para {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <CardDescription>
              {agendamentos.length} agendamento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agendamentos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum agendamento para esta data
              </p>
            ) : (
              <div className="space-y-4">
                {agendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h4 className="font-semibold">{agendamento.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{agendamento.descricao}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(agendamento.data_inicio), "HH:mm")} - {format(new Date(agendamento.data_fim), "HH:mm")}
                          </span>
                          <Badge variant="outline">{getTipoLabel(agendamento.tipo)}</Badge>
                        </div>
                      </div>
                      <Badge className={getStatusColor(agendamento.status)}>
                        {agendamento.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Novo Agendamento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Manutenção de elevador"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes do agendamento"
                rows={3}
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger>
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
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Início *</Label>
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora Fim *</Label>
                <Input
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreateAgendamento} disabled={loading} className="w-full">
              {loading ? "Criando..." : "Criar Agendamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
