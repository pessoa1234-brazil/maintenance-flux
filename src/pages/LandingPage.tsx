import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Clock, FileText, Award, BarChart, Users, Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const diferenciais = [
    {
      icon: Shield,
      title: "Gestão de Garantias",
      description: "Controle completo das garantias ABNT NBR 17170:2022 com alertas automáticos e rastreamento de prazos."
    },
    {
      icon: Clock,
      title: "Manutenção Preventiva",
      description: "Sistema inteligente de previsão e agendamento de manutenções para preservar garantias e valor do patrimônio."
    },
    {
      icon: FileText,
      title: "Documentação Centralizada",
      description: "Todos os manuais, especificações técnicas e registros de serviços em um único lugar acessível."
    },
    {
      icon: Award,
      title: "Marketplace de Prestadores",
      description: "Conecte-se com prestadores qualificados, avaliados e ranqueados pela comunidade."
    },
    {
      icon: BarChart,
      title: "Análise e Relatórios",
      description: "Dashboards completos com métricas, KPIs e relatórios personalizados para tomada de decisão."
    },
    {
      icon: Users,
      title: "Gestão Multi-stakeholder",
      description: "Plataforma integrada para construtoras, condomínios, clientes e prestadores de serviço."
    }
  ];

  const depoimentos = [
    {
      nome: "João Silva",
      cargo: "Síndico - Condomínio Residencial Vista Verde",
      texto: "Com o Manutenção360 conseguimos reduzir em 40% os custos com manutenções corretivas. O sistema de alertas preventivos é excepcional!"
    },
    {
      nome: "Maria Santos",
      cargo: "Gerente de Obras - Construtora Horizonte",
      texto: "Revolucionou nossa gestão de garantias. Agora temos controle total sobre prazos e obrigações, evitando passivos futuros."
    },
    {
      nome: "Carlos Oliveira",
      cargo: "Prestador de Serviços - Engenharia Predial",
      texto: "O marketplace me conectou com dezenas de novos clientes. A gamificação incentiva a qualidade e profissionalismo."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Manutenção360</h1>
          </div>
          <Button onClick={() => navigate("/auth")} size="lg">
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Gestão Completa de Manutenção e Garantias Prediais
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Plataforma B2B que integra construtoras, condomínios e prestadores de serviço em conformidade com as normas ABNT. 
            Preserve garantias, reduza custos e otimize a gestão do seu patrimônio.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => navigate("/auth")} size="lg" className="text-lg px-8">
              Começar Agora
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" size="lg" className="text-lg px-8">
              Saber Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Por que escolher o Manutenção360?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diferenciais.map((diff, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <diff.icon className="h-12 w-12 text-primary mb-4" />
                  <h4 className="text-xl font-semibold mb-3 text-foreground">{diff.title}</h4>
                  <p className="text-muted-foreground">{diff.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            O que nossos clientes dizem
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {depoimentos.map((depoimento, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <p className="text-muted-foreground italic mb-4">"{depoimento.texto}"</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-foreground">{depoimento.nome}</p>
                    <p className="text-sm text-muted-foreground">{depoimento.cargo}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para transformar sua gestão de manutenção?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a centenas de condomínios e construtoras que já confiam no Manutenção360
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" variant="secondary" className="text-lg px-8">
            Criar Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Empresa */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h4 className="text-lg font-bold text-foreground">Manutenção360</h4>
              </div>
              <p className="text-muted-foreground mb-4">
                Solução completa para gestão de manutenção predial e garantias em conformidade com normas ABNT.
              </p>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-foreground">Contato</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p>Av. Paulista, 1000 - São Paulo, SP<br />CEP 01310-100</p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <p>(11) 3000-0000</p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <p>contato@manutencao360.com.br</p>
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-foreground">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors" aria-label="Facebook">
                  <Facebook className="h-5 w-5 text-foreground" />
                </a>
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors" aria-label="Instagram">
                  <Instagram className="h-5 w-5 text-foreground" />
                </a>
                <a href="#" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5 text-foreground" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Manutenção360. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
