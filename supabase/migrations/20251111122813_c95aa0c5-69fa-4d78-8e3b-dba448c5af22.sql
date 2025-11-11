-- Adicionar campos de vinculação no profiles
ALTER TABLE public.profiles
ADD COLUMN empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE SET NULL,
ADD COLUMN unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL;

-- Criar índices para melhorar performance
CREATE INDEX idx_profiles_empreendimento ON public.profiles(empreendimento_id);
CREATE INDEX idx_profiles_unidade ON public.profiles(unidade_id);

-- Atualizar política RLS para permitir que condomínios vejam empreendimentos aos quais estão vinculados
CREATE POLICY "Usuários vinculados podem ver empreendimentos"
ON public.empreendimentos FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT empreendimento_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND empreendimento_id IS NOT NULL
  )
);

-- Política para condomínios vinculados atualizarem perfil com empreendimento/unidade
CREATE POLICY "Usuários podem atualizar próprio vínculo"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);