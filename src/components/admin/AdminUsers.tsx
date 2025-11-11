import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Phone, Building, Filter, X } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  nota_media: number;
  total_avaliacoes: number;
  user_roles: Array<{ role: string }>;
  empreendimento_id: string | null;
  empreendimentos: { nome: string } | null;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filtro por busca de texto
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por role
    if (roleFilter !== "all") {
      filtered = filtered.filter(user =>
        user.user_roles?.some(r => r.role === roleFilter)
      );
    }

    // Filtro por avaliação
    if (ratingFilter !== "all") {
      filtered = filtered.filter(user => {
        if (ratingFilter === "5-stars") return user.nota_media >= 4.5;
        if (ratingFilter === "4-stars") return user.nota_media >= 4 && user.nota_media < 4.5;
        if (ratingFilter === "3-stars") return user.nota_media >= 3 && user.nota_media < 4;
        if (ratingFilter === "below-3") return user.nota_media < 3 && user.total_avaliacoes > 0;
        if (ratingFilter === "no-rating") return user.total_avaliacoes === 0;
        return true;
      });
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, ratingFilter, users]);

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setRatingFilter("all");
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Carregar roles para cada usuário
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          const { data: emp } = await supabase
            .from('empreendimentos')
            .select('nome')
            .eq('id', user.empreendimento_id || '')
            .single();

          return {
            ...user,
            user_roles: roles || [],
            empreendimentos: emp
          };
        })
      );

      setUsers(usersWithRoles as any);
      setFilteredUsers(usersWithRoles as any);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500',
      construtora: 'bg-blue-500',
      prestador: 'bg-green-500',
      condominio: 'bg-purple-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="text-center p-8">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            {filteredUsers.length} de {users.length} usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="construtora">Construtora</SelectItem>
                  <SelectItem value="prestador">Prestador</SelectItem>
                  <SelectItem value="condominio">Condomínio</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as avaliações</SelectItem>
                  <SelectItem value="5-stars">⭐ 4.5+ estrelas</SelectItem>
                  <SelectItem value="4-stars">⭐ 4.0 - 4.4 estrelas</SelectItem>
                  <SelectItem value="3-stars">⭐ 3.0 - 3.9 estrelas</SelectItem>
                  <SelectItem value="below-3">⭐ Abaixo de 3.0</SelectItem>
                  <SelectItem value="no-rating">Sem avaliações</SelectItem>
                </SelectContent>
              </Select>

              {(roleFilter !== "all" || ratingFilter !== "all" || searchTerm) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{user.full_name}</h4>
                    {user.user_roles?.map((role, index) => (
                      <Badge key={index} className={getRoleColor(role.role)}>
                        {role.role}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </span>
                    )}
                    {user.empreendimentos && (
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {user.empreendimentos.nome}
                      </span>
                    )}
                  </div>
                  {user.total_avaliacoes > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ⭐ {user.nota_media.toFixed(1)} ({user.total_avaliacoes} avaliações)
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
