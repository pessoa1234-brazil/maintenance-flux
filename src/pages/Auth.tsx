import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Users, User, Wrench } from "lucide-react";

type UserRole = "construtora" | "condominio" | "cliente" | "prestador";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("condominio");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roleOptions = [
    { value: "construtora", label: "Construtora / Incorporadora", icon: Building2, description: "Cadastre empreendimentos e gerencie garantias" },
    { value: "condominio", label: "Condomínio / Síndico", icon: Users, description: "Solicite manutenções e acompanhe garantias" },
    { value: "cliente", label: "Cliente PF/PJ", icon: User, description: "Acompanhe manutenções da sua propriedade" },
    { value: "prestador", label: "Prestador de Serviços", icon: Wrench, description: "Ofereça orçamentos e execute serviços" },
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: selectedRole,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Criar role do usuário
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert([{ user_id: data.user.id, role: selectedRole }]);

          if (roleError) {
            console.error("Erro ao criar role:", roleError);
          }

          toast.success("Cadastro realizado com sucesso!");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Entrar" : "Criar Conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "Entre com suas credenciais para acessar o sistema"
              : "Escolha seu tipo de perfil e preencha seus dados"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Tipo de Perfil</Label>
                  <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                    {roleOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="flex items-start gap-3 cursor-pointer flex-1">
                            <Icon className="w-5 h-5 mt-0.5 text-primary" />
                            <div className="flex-1">
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder={isLogin ? "Digite sua senha" : "Mínimo 12 caracteres"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? undefined : 12}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  Use no mínimo 12 caracteres com letras, números e símbolos
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
