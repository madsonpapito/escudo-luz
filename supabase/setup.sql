-- ==============================================================================
-- 🛡️ ESCUDO DE LUZ: SETUP DO BANCO DE DADOS (SUPABASE)
-- Copie todo este código e cole na aba "SQL Editor" do seu painel do Supabase.
-- Depois, clique em "Run" (Executar).
-- ==============================================================================

-- 1. Cria a tabela de perfis do Escudo de Luz (vinculada aos usuários do sistema de Auth)
CREATE TABLE public.escudo_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active', -- Ex: 'active' ou 'refunded'
  dias_concluidos INTEGER[] DEFAULT '{}', -- Array guardando os dias (Ex: [1, 2, 3])
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Habilita Políticas de Segurança em nível de linha (RLS)
ALTER TABLE public.escudo_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Regra: Um usuário só pode "Puxar" (Ver) o próprio perfil e progresso
CREATE POLICY "Visualizar próprio perfil" 
ON public.escudo_profiles 
FOR SELECT USING (auth.uid() = id);

-- 4. Regra: Um usuário só pode "Atualizar" o próprio perfil e progresso
CREATE POLICY "Atualizar próprio perfil" 
ON public.escudo_profiles 
FOR UPDATE USING (auth.uid() = id);

-- 5. Função Mágica: Cria o perfil na tabela automaticamente sempre que a Kiwify criar um usuário
CREATE OR REPLACE FUNCTION public.handle_new_escudo_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.escudo_profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Gatilho (Trigger): Fica "vigiando" novas contas para ativar a Função Mágica
CREATE TRIGGER on_escudo_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_escudo_user();

-- PRONTO! Tudo configurado. 
-- Obs: A Edge Function vai precisar da sua URL e da KEY, mas a base já tá pronta para receber os clientes!
