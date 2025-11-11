import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Clock, FileText, Award, BarChart, Users, Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Play, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";

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

  const faqItems = [
    {
      pergunta: "Como funciona a gestão de garantias ABNT?",
      resposta: "O sistema rastreia automaticamente todas as garantias conforme ABNT NBR 17170:2022, calculando prazos a partir da data de entrega do empreendimento. Você recebe alertas antes do vencimento e mantém histórico completo de todas as solicitações."
    },
    {
      pergunta: "Quanto tempo leva para implementar a plataforma?",
      resposta: "A implementação é imediata. Após o cadastro, você já pode começar a cadastrar empreendimentos, vincular usuários e criar ordens de serviço. Oferecemos suporte completo para migração de dados existentes."
    },
    {
      pergunta: "Como funcionam os pagamentos e comissões?",
      resposta: "A plataforma processa pagamentos de forma segura via integração com Stripe/Mercado Pago. As comissões são distribuídas automaticamente entre as partes conforme acordado, com transparência total no processo."
    },
    {
      pergunta: "Prestadores de serviço precisam pagar para usar?",
      resposta: "Prestadores pagam apenas uma comissão sobre serviços executados através da plataforma. Não há mensalidade fixa. Quanto melhor sua avaliação e ranking, mais oportunidades você recebe."
    },
    {
      pergunta: "A plataforma emite relatórios de conformidade?",
      resposta: "Sim! Geramos relatórios completos de conformidade ABNT NBR 5674 demonstrando que a manutenção preventiva está sendo seguida. Esses relatórios são essenciais para manter a validade das garantias."
    },
    {
      pergunta: "Como funciona o sistema de avaliação de prestadores?",
      resposta: "Após cada serviço concluído, clientes avaliam prestadores com notas e comentários. Essas avaliações formam o ranking público que ajuda outros usuários a escolher os melhores profissionais."
    }
  ];

  const tourSteps = [
    {
      icon: CheckCircle,
      title: "Cadastre Empreendimentos",
      description: "Registre projetos com especificações técnicas, manuais e documentação completa"
    },
    {
      icon: AlertCircle,
      title: "Receba Alertas Automáticos",
      description: "Sistema monitora prazos de garantia e manutenções preventivas, alertando proativamente"
    },
    {
      icon: Users,
      title: "Conecte com Prestadores",
      description: "Marketplace com prestadores qualificados prontos para atender suas demandas"
    },
    {
      icon: BarChart,
      title: "Analise Performance",
      description: "Dashboards com métricas de custos, prazos e eficiência operacional"
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

      {/* Vídeo Demo / Tour Interativo */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-6 text-foreground">
            Veja como funciona
          </h3>
          <p className="text-center text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
            Conheça os principais recursos da plataforma e como ela pode transformar sua gestão de manutenção
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            {/* Vídeo Placeholder */}
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border shadow-lg hover-scale">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/90 hover:bg-primary transition-colors cursor-pointer mb-4">
                    <Play className="h-10 w-10 text-primary-foreground ml-1" />
                  </div>
                  <p className="text-foreground font-semibold text-lg">Assistir Demo (3 min)</p>
                  <p className="text-muted-foreground text-sm mt-2">Demonstração completa da plataforma</p>
                </div>
              </div>
            </div>

            {/* Tour Steps */}
            <div className="space-y-4">
              {tourSteps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start p-4 rounded-lg bg-card border border-border hover:shadow-md transition-shadow animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            O que nossos clientes dizem
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {depoimentos.map((depoimento, index) => (
              <Card key={index} className="border-border hover-scale">
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

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Perguntas Frequentes
            </h3>
            <p className="text-muted-foreground text-lg">
              Tire suas dúvidas sobre a plataforma
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-card border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold text-foreground">{item.pergunta}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.resposta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
            <Button onClick={() => navigate("/auth")} variant="outline" size="lg">
              Fale com Nossa Equipe
            </Button>
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
