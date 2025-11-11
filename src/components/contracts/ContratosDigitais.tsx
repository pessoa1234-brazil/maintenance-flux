import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, Check, X, Clock } from "lucide-react";

interface Contrato {
  id: string;
  titulo: string;
  descricao: string;
  valor: number;
  prazo_dias: number;
  status: string;
  created_at: string;
  assinatura_prestador_data: string | null;
  assinatura_solicitante_data: string | null;
}

export const ContratosDigitais = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    valor: "",
    prazo_dias: "",
    termos_condicoes: ""
  });

  useEffect(() => {
    loadContratos();
  }, []);

  const loadContratos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .or(`prestador_id.eq.${user.id},solicitante_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContratos(data || []);
    } catch (error) {
      console.error("Erro ao carregar contratos:", error);
    }
  };

  const handleCreateContrato = async () => {
    if (!formData.titulo || !formData.valor || !formData.prazo_dias || !formData.termos_condicoes) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Aqui você precisaria selecionar o prestador, por simplicidade vou usar o mesmo user
      const { error } = await supabase
        .from("contratos")
        .insert({
          titulo: formData.titulo,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          prazo_dias: parseInt(formData.prazo_dias),
          termos_condicoes: formData.termos_condicoes,
          prestador_id: user.id,
          solicitante_id: user.id
        });

      if (error) throw error;

      toast.success("Contrato criado com sucesso!");
      setIsModalOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        valor: "",
        prazo_dias: "",
        termos_condicoes: ""
      });
      loadContratos();
    } catch (error: any) {
      console.error("Erro ao criar contrato:", error);
      toast.error("Erro ao criar contrato");
    } finally {
      setLoading(false);
    }
  };

  const handleAssinarContrato = async (contratoId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar IP do usuário
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();

      // Criar hash de assinatura (simplificado)
      const assinaturaHash = btoa(`${user.id}-${contratoId}-${new Date().toISOString()}`);

      // Registrar assinatura
      const { error: assinaturaError } = await supabase
        .from("assinaturas_contrato")
        .insert({
          contrato_id: contratoId,
          assinante_id: user.id,
          tipo_assinante: "solicitante", // Determinar dinamicamente
          assinatura_hash: assinaturaHash,
          ip_address: ip,
          user_agent: navigator.userAgent
        });

      if (assinaturaError) throw assinaturaError;

      // Atualizar status do contrato
      const { error: updateError } = await supabase
        .from("contratos")
        .update({
          status: "assinado_solicitante",
          assinatura_solicitante_data: new Date().toISOString(),
          assinatura_solicitante_ip: ip
        })
        .eq("id", contratoId);

      if (updateError) throw updateError;

      toast.success("Contrato assinado digitalmente!");
      loadContratos();
    } catch (error: any) {
      console.error("Erro ao assinar contrato:", error);
      toast.error("Erro ao assinar contrato");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pendente: { label: "Pendente", icon: Clock, color: "bg-yellow-500" },
      assinado_prestador: { label: "Assinado por Prestador", icon: Check, color: "bg-blue-500" },
      assinado_solicitante: { label: "Assinado por Solicitante", icon: Check, color: "bg-blue-500" },
      ativo: { label: "Ativo", icon: Check, color: "bg-green-500" },
      concluido: { label: "Concluído", icon: Check, color: "bg-gray-500" },
      cancelado: { label: "Cancelado", icon: X, color: "bg-red-500" }
    };
    
    const config = variants[status] || variants.pendente;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Contratos Digitais</h2>
          <p className="text-muted-foreground">Gerencie contratos com assinatura eletrônica</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <FileText className="h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contratos.map((contrato) => (
          <Card key={contrato.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{contrato.titulo}</CardTitle>
                {getStatusBadge(contrato.status)}
              </div>
              <CardDescription>{contrato.descricao}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold">R$ {Number(contrato.valor).toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prazo:</span>
                  <span>{contrato.prazo_dias} dias</span>
                </div>
                <Separator className="my-2" />
                {contrato.assinatura_prestador_data && (
                  <div className="text-xs text-muted-foreground">
                    ✓ Assinado por prestador em {new Date(contrato.assinatura_prestador_data).toLocaleString("pt-BR")}
                  </div>
                )}
                {contrato.assinatura_solicitante_data && (
                  <div className="text-xs text-muted-foreground">
                    ✓ Assinado por solicitante em {new Date(contrato.assinatura_solicitante_data).toLocaleString("pt-BR")}
                  </div>
                )}
                {contrato.status === "pendente" && (
                  <Button
                    onClick={() => handleAssinarContrato(contrato.id)}
                    disabled={loading}
                    size="sm"
                    className="w-full mt-2"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Assinar Digitalmente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Novo Contrato */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Contrato Digital</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Contrato de Manutenção Predial"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Breve descrição do contrato"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Prazo (dias) *</Label>
                <Input
                  type="number"
                  value={formData.prazo_dias}
                  onChange={(e) => setFormData({ ...formData, prazo_dias: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            <div>
              <Label>Termos e Condições *</Label>
              <Textarea
                value={formData.termos_condicoes}
                onChange={(e) => setFormData({ ...formData, termos_condicoes: e.target.value })}
                placeholder="Digite os termos e condições do contrato..."
                rows={6}
              />
            </div>
            <Button onClick={handleCreateContrato} disabled={loading} className="w-full">
              {loading ? "Criando..." : "Criar Contrato"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
