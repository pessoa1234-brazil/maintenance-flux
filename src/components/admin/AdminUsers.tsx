import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, Building } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

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
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
