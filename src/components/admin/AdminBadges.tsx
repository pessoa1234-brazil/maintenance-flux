import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BadgeData {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  criterio: string;
  pontos_necessarios: number;
  cor: string;
  raridade: string;
}

export function AdminBadges() {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    icone: "🏆",
    criterio: "",
    pontos_necessarios: 0,
    cor: "#3B82F6",
    raridade: "comum"
  });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('pontos_necessarios', { ascending: true });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Erro ao carregar badges:', error);
      toast.error("Erro ao carregar badges");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingBadge) {
        const { error } = await supabase
          .from('badges')
          .update(formData)
          .eq('id', editingBadge.id);

        if (error) throw error;
        toast.success("Badge atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('badges')
          .insert(formData);

        if (error) throw error;
        toast.success("Badge criado com sucesso!");
      }

      setIsModalOpen(false);
      setEditingBadge(null);
      setFormData({
        nome: "",
        descricao: "",
        icone: "🏆",
        criterio: "",
        pontos_necessarios: 0,
        cor: "#3B82F6",
        raridade: "comum"
      });
      loadBadges();
    } catch (error) {
      console.error('Erro ao salvar badge:', error);
      toast.error("Erro ao salvar badge");
    }
  };

  const handleEdit = (badge: BadgeData) => {
    setEditingBadge(badge);
    setFormData({
      nome: badge.nome,
      descricao: badge.descricao,
      icone: badge.icone,
      criterio: badge.criterio,
      pontos_necessarios: badge.pontos_necessarios,
      cor: badge.cor,
      raridade: badge.raridade
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este badge?')) return;

    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Badge excluído com sucesso!");
      loadBadges();
    } catch (error) {
      console.error('Erro ao excluir badge:', error);
      toast.error("Erro ao excluir badge");
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando badges...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Gerenciar Badges
              </CardTitle>
              <CardDescription>
                {badges.length} badges cadastrados
              </CardDescription>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBadge(null);
                  setFormData({
                    nome: "",
                    descricao: "",
                    icone: "🏆",
                    criterio: "",
                    pontos_necessarios: 0,
                    cor: "#3B82F6",
                    raridade: "comum"
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Badge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingBadge ? 'Editar Badge' : 'Novo Badge'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ícone (emoji)</Label>
                    <Input
                      value={formData.icone}
                      onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Critério</Label>
                    <Input
                      value={formData.criterio}
                      onChange={(e) => setFormData({ ...formData, criterio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Pontos Necessários</Label>
                    <Input
                      type="number"
                      value={formData.pontos_necessarios}
                      onChange={(e) => setFormData({ ...formData, pontos_necessarios: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Raridade</Label>
                    <Select
                      value={formData.raridade}
                      onValueChange={(value) => setFormData({ ...formData, raridade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comum">Comum</SelectItem>
                        <SelectItem value="raro">Raro</SelectItem>
                        <SelectItem value="épico">Épico</SelectItem>
                        <SelectItem value="lendário">Lendário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingBadge ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{badge.icone}</div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(badge)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(badge.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h4 className="font-semibold">{badge.nome}</h4>
                <p className="text-sm text-muted-foreground">{badge.descricao}</p>
                <div className="flex gap-2 mt-2">
                  <Badge>{badge.raridade}</Badge>
                  <Badge variant="outline">{badge.pontos_necessarios} pts</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
