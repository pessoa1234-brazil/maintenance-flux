-- 1. Criar o ENUM de roles (tipos de usuário)
CREATE TYPE public.app_role AS ENUM ('admin', 'construtora', 'condominio', 'prestador');

-- 2. Criar tabela de perfis (estende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  document TEXT, -- CPF/CNPJ
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar tabela de roles de usuários (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Função de segurança para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Criar tabela de empreendimentos (vinculados a construtoras)
CREATE TABLE public.empreendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT NOT NULL,
  data_entrega DATE NOT NULL, -- Data de entrega/habite-se
  construtora_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_unidades INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Criar tabela de unidades (apartamentos/salas dentro do empreendimento)
CREATE TABLE public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  numero TEXT NOT NULL, -- Ex: "101", "Apto 302"
  bloco TEXT, -- Ex: "Bloco A"
  condominio_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Síndico/Responsável
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empreendimento_id, numero, bloco)
);

-- 7. Criar ENUM de tipo de documento
CREATE TYPE public.tipo_documento AS ENUM ('NOTA_FISCAL', 'MANUAL_TECNICO', 'LAUDO', 'FOTO', 'OUTRO');

-- 8. Criar tabela de documentos
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo tipo_documento NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Criar tabela de ativos (equipamentos com garantia)
CREATE TABLE public.ativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  marca_modelo TEXT NOT NULL,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  data_instalacao DATE NOT NULL,
  garantia_meses INTEGER NOT NULL, -- Prazo de garantia em meses
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Criar tabela de relação ativos-documentos (muitos-para-muitos)
CREATE TABLE public.ativos_documentos (
  ativo_id UUID NOT NULL REFERENCES public.ativos(id) ON DELETE CASCADE,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  PRIMARY KEY (ativo_id, documento_id)
);

-- 11. Criar ENUM de status de OS
CREATE TYPE public.status_os AS ENUM ('A_FAZER', 'PENDENTE_ORCAMENTO', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- 12. Criar ENUM de origem da OS
CREATE TYPE public.origem_os AS ENUM ('GARANTIA', 'MANUTENCAO_PREVENTIVA', 'MANUTENCAO_CORRETIVA');

-- 13. Criar tabela de ordens de serviço
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status status_os NOT NULL DEFAULT 'A_FAZER',
  origem origem_os NOT NULL,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  ativo_id UUID REFERENCES public.ativos(id) ON DELETE SET NULL,
  solicitante_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Quem abriu a OS
  prestador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Quem foi escolhido
  data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_conclusao TIMESTAMPTZ,
  valor_final DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Criar ENUM de status de orçamento
CREATE TYPE public.status_orcamento AS ENUM ('PENDENTE', 'ACEITO', 'RECUSADO');

-- 15. Criar tabela de orçamentos (propostas do marketplace)
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  prestador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  prazo_dias INTEGER,
  status status_orcamento NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Criar ENUM de tipo de item de checklist
CREATE TYPE public.tipo_item_checklist AS ENUM ('CHECKBOX', 'TEXTO', 'FOTO');

-- 17. Criar tabela de checklists
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(os_id)
);

-- 18. Criar tabela de itens de checklist
CREATE TABLE public.itens_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo tipo_item_checklist NOT NULL,
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  preenchido BOOLEAN NOT NULL DEFAULT false,
  resposta_bool BOOLEAN,
  resposta_texto TEXT,
  resposta_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativos_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_checklist ENABLE ROW LEVEL SECURITY;

-- 20. Políticas RLS para PROFILES
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 21. Políticas RLS para USER_ROLES
CREATE POLICY "Usuários podem ver seus próprios roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todos os roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 22. Políticas RLS para EMPREENDIMENTOS
CREATE POLICY "Construtoras podem ver seus empreendimentos"
  ON public.empreendimentos FOR SELECT
  USING (construtora_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Construtoras podem criar empreendimentos"
  ON public.empreendimentos FOR INSERT
  WITH CHECK (construtora_id = auth.uid() AND public.has_role(auth.uid(), 'construtora'));

CREATE POLICY "Construtoras podem atualizar seus empreendimentos"
  ON public.empreendimentos FOR UPDATE
  USING (construtora_id = auth.uid());

-- 23. Políticas RLS para UNIDADES
CREATE POLICY "Todos usuários autenticados podem ver unidades"
  ON public.unidades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Construtoras podem criar unidades"
  ON public.unidades FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'construtora') OR public.has_role(auth.uid(), 'admin'));

-- 24. Políticas RLS para ATIVOS
CREATE POLICY "Todos usuários autenticados podem ver ativos"
  ON public.ativos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Construtoras e condomínios podem criar ativos"
  ON public.ativos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'construtora') OR public.has_role(auth.uid(), 'condominio'));

-- 25. Políticas RLS para DOCUMENTOS
CREATE POLICY "Usuários autenticados podem ver documentos"
  ON public.documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar documentos"
  ON public.documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 26. Políticas RLS para ATIVOS_DOCUMENTOS
CREATE POLICY "Usuários autenticados podem ver relações"
  ON public.ativos_documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar relações"
  ON public.ativos_documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 27. Políticas RLS para ORDENS_SERVICO
CREATE POLICY "Usuários podem ver OS relacionadas"
  ON public.ordens_servico FOR SELECT
  USING (
    solicitante_id = auth.uid() OR 
    prestador_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Condomínios e construtoras podem criar OS"
  ON public.ordens_servico FOR INSERT
  WITH CHECK (
    solicitante_id = auth.uid() AND 
    (public.has_role(auth.uid(), 'condominio') OR public.has_role(auth.uid(), 'construtora'))
  );

CREATE POLICY "Solicitantes podem atualizar suas OS"
  ON public.ordens_servico FOR UPDATE
  USING (solicitante_id = auth.uid() OR prestador_id = auth.uid());

-- 28. Políticas RLS para ORCAMENTOS
CREATE POLICY "Usuários podem ver orçamentos relacionados"
  ON public.orcamentos FOR SELECT
  USING (
    prestador_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.ordens_servico 
      WHERE id = os_id AND solicitante_id = auth.uid()
    )
  );

CREATE POLICY "Prestadores podem criar orçamentos"
  ON public.orcamentos FOR INSERT
  WITH CHECK (prestador_id = auth.uid() AND public.has_role(auth.uid(), 'prestador'));

CREATE POLICY "Prestadores podem atualizar seus orçamentos"
  ON public.orcamentos FOR UPDATE
  USING (prestador_id = auth.uid());

-- 29. Políticas RLS para CHECKLISTS
CREATE POLICY "Usuários podem ver checklists relacionados"
  ON public.checklists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ordens_servico 
      WHERE id = os_id AND (solicitante_id = auth.uid() OR prestador_id = auth.uid())
    )
  );

CREATE POLICY "Sistema pode criar checklists"
  ON public.checklists FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 30. Políticas RLS para ITENS_CHECKLIST
CREATE POLICY "Usuários podem ver itens de checklist relacionados"
  ON public.itens_checklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checklists c
      JOIN public.ordens_servico os ON os.id = c.os_id
      WHERE c.id = checklist_id 
      AND (os.solicitante_id = auth.uid() OR os.prestador_id = auth.uid())
    )
  );

CREATE POLICY "Usuários podem atualizar itens de checklist"
  ON public.itens_checklist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.checklists c
      JOIN public.ordens_servico os ON os.id = c.os_id
      WHERE c.id = checklist_id 
      AND (os.solicitante_id = auth.uid() OR os.prestador_id = auth.uid())
    )
  );

-- 31. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empreendimentos_updated_at BEFORE UPDATE ON public.empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ativos_updated_at BEFORE UPDATE ON public.ativos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 32. Trigger para criar perfil ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();