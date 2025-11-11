-- Criar tabela de agendamentos
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  prestador_id UUID REFERENCES public.profiles(id) NOT NULL,
  solicitante_id UUID REFERENCES public.profiles(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido')),
  tipo TEXT NOT NULL CHECK (tipo IN ('manutencao_preventiva', 'visita_tecnica', 'inspecao', 'outro')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agendamentos
CREATE POLICY "Usuários podem ver seus agendamentos"
ON public.agendamentos FOR SELECT
USING (auth.uid() = prestador_id OR auth.uid() = solicitante_id);

CREATE POLICY "Prestadores e solicitantes podem criar agendamentos"
ON public.agendamentos FOR INSERT
WITH CHECK (auth.uid() = prestador_id OR auth.uid() = solicitante_id);

CREATE POLICY "Usuários podem atualizar seus agendamentos"
ON public.agendamentos FOR UPDATE
USING (auth.uid() = prestador_id OR auth.uid() = solicitante_id);

-- Criar tabela de SLA (Service Level Agreement)
CREATE TABLE public.sla_configuracao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empreendimento_id UUID REFERENCES public.empreendimentos(id),
  tipo_servico tipo_servico NOT NULL,
  sistema_predial TEXT,
  prazo_resposta_horas INTEGER NOT NULL,
  prazo_conclusao_dias INTEGER NOT NULL,
  alerta_percentual INTEGER NOT NULL DEFAULT 80 CHECK (alerta_percentual > 0 AND alerta_percentual <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sla_configuracao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Construtoras podem gerenciar SLA"
ON public.sla_configuracao FOR ALL
USING (has_role(auth.uid(), 'construtora'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Todos podem ver SLA"
ON public.sla_configuracao FOR SELECT
USING (true);

-- Criar tabela de contratos digitais
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID REFERENCES public.ordens_servico(id),
  prestador_id UUID REFERENCES public.profiles(id) NOT NULL,
  solicitante_id UUID REFERENCES public.profiles(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  prazo_dias INTEGER NOT NULL,
  termos_condicoes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'assinado_prestador', 'assinado_solicitante', 'ativo', 'concluido', 'cancelado')),
  assinatura_prestador_data TIMESTAMP WITH TIME ZONE,
  assinatura_prestador_ip TEXT,
  assinatura_solicitante_data TIMESTAMP WITH TIME ZONE,
  assinatura_solicitante_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus contratos"
ON public.contratos FOR SELECT
USING (auth.uid() = prestador_id OR auth.uid() = solicitante_id);

CREATE POLICY "Solicitantes podem criar contratos"
ON public.contratos FOR INSERT
WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Partes podem atualizar contratos"
ON public.contratos FOR UPDATE
USING (auth.uid() = prestador_id OR auth.uid() = solicitante_id);

-- Criar tabela de assinaturas de contratos
CREATE TABLE public.assinaturas_contrato (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE NOT NULL,
  assinante_id UUID REFERENCES public.profiles(id) NOT NULL,
  tipo_assinante TEXT NOT NULL CHECK (tipo_assinante IN ('prestador', 'solicitante')),
  assinatura_hash TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas_contrato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver assinaturas de seus contratos"
ON public.assinaturas_contrato FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contratos
    WHERE contratos.id = assinaturas_contrato.contrato_id
    AND (contratos.prestador_id = auth.uid() OR contratos.solicitante_id = auth.uid())
  )
);

CREATE POLICY "Usuários podem criar suas assinaturas"
ON public.assinaturas_contrato FOR INSERT
WITH CHECK (auth.uid() = assinante_id);

-- Criar índices para performance
CREATE INDEX idx_agendamentos_prestador ON public.agendamentos(prestador_id);
CREATE INDEX idx_agendamentos_solicitante ON public.agendamentos(solicitante_id);
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data_inicio);
CREATE INDEX idx_contratos_status ON public.contratos(status);
CREATE INDEX idx_sla_tipo_servico ON public.sla_configuracao(tipo_servico);