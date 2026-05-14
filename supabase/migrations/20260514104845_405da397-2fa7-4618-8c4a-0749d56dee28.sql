-- Plans, statuses, categories enums
CREATE TYPE public.app_plan AS ENUM ('free', 'pro');
CREATE TYPE public.service_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.expense_category AS ENUM ('combustivel', 'alimentacao', 'ferramentas', 'transporte', 'materiais', 'equipe', 'outros');
CREATE TYPE public.goal_type AS ENUM ('revenue', 'profit', 'services_count');
CREATE TYPE public.goal_period AS ENUM ('week', 'month');
CREATE TYPE public.challenge_period AS ENUM ('weekly', 'monthly');

-- ============== profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  business_name TEXT,
  profession_type TEXT,
  monthly_goal NUMERIC(12,2) DEFAULT 0,
  plan public.app_plan NOT NULL DEFAULT 'free',
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  current_streak_days INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: select own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status public.service_status NOT NULL DEFAULT 'scheduled',
  agreed_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_price NUMERIC(12,2),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX services_user_id_idx ON public.services(user_id);
CREATE INDEX services_user_status_idx ON public.services(user_id, status);
CREATE INDEX services_user_completed_idx ON public.services(user_id, completed_at DESC);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services: select own" ON public.services FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Services: insert own" ON public.services FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Services: update own" ON public.services FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Services: delete own" ON public.services FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  category public.expense_category NOT NULL,
  description TEXT,
  occurred_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX expenses_user_id_idx ON public.expenses(user_id);
CREATE INDEX expenses_user_occurred_idx ON public.expenses(user_id, occurred_at DESC);
CREATE INDEX expenses_user_category_idx ON public.expenses(user_id, category);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expenses: select own" ON public.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Expenses: insert own" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Expenses: update own" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Expenses: delete own" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============== achievements_catalog
CREATE TABLE public.achievements_catalog (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  pro_only BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.achievements_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements catalog: read all" ON public.achievements_catalog FOR SELECT TO authenticated USING (true);

INSERT INTO public.achievements_catalog (code, title, description, icon, xp_reward, tier, sort_order) VALUES
  ('first_measure', 'Primeira Medida', 'Conclua seu primeiro serviço', '📏', 50, 'bronze', 1),
  ('first_expense', 'Olho no Bolso', 'Registre sua primeira despesa', '💸', 20, 'bronze', 2),
  ('first_thousand', 'Primeiro Mil', 'Fature R$ 1.000 acumulado', '💰', 100, 'silver', 3),
  ('first_five_thousand', 'Cinco Mil', 'Fature R$ 5.000 acumulado', '💎', 250, 'gold', 4),
  ('streak_3', 'Pegou o Ritmo', '3 dias seguidos registrando', '🔥', 30, 'bronze', 5),
  ('streak_7', 'Sequência de Fogo', '7 dias seguidos registrando', '🔥', 80, 'silver', 6),
  ('streak_30', 'Disciplina de Mestre', '30 dias seguidos registrando', '⚡', 300, 'gold', 7),
  ('ten_services', 'Dez Conquistadas', 'Conclua 10 serviços', '🛠️', 100, 'silver', 8),
  ('fifty_services', 'Meio Centenário', 'Conclua 50 serviços', '🏆', 400, 'gold', 9),
  ('high_margin', 'Margem de Mestre', 'Atinja margem acima de 30% no mês', '📈', 150, 'silver', 10),
  ('first_goal', 'Meta Batida', 'Cumpra sua primeira meta mensal', '🎯', 200, 'silver', 11),
  ('speedster', 'Velocista', 'Conclua 5 serviços em uma semana', '⚡', 120, 'silver', 12),
  ('level_5', 'Nível 5 Atingido', 'Suba para o nível 5', '⭐', 0, 'silver', 13),
  ('level_10', 'Nível 10 Atingido', 'Suba para o nível 10', '🌟', 0, 'gold', 14),
  ('expense_tracker', 'Fiscal de Si Mesmo', 'Registre 20 despesas', '📊', 80, 'bronze', 15);

-- ============== user_achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_code TEXT NOT NULL REFERENCES public.achievements_catalog(code),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_code)
);

CREATE INDEX user_achievements_user_idx ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User achievements: select own" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User achievements: insert own" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============== challenges_catalog
CREATE TABLE public.challenges_catalog (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⚡',
  metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  period public.challenge_period NOT NULL DEFAULT 'weekly',
  xp_reward INT NOT NULL DEFAULT 0,
  pro_only BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.challenges_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges catalog: read all" ON public.challenges_catalog FOR SELECT TO authenticated USING (true);

INSERT INTO public.challenges_catalog (code, title, description, icon, metric, target_value, period, xp_reward, sort_order) VALUES
  ('weekly_5_services', '5 Serviços na Semana', 'Conclua 5 serviços nesta semana', '🛠️', 'services_completed', 5, 'weekly', 100, 1),
  ('weekly_register_daily', 'Toda Semana Ativo', 'Registre algo todos os dias da semana', '📅', 'days_active', 7, 'weekly', 80, 2),
  ('weekly_revenue_2k', 'Bata os R$ 2.000', 'Fature R$ 2.000 nesta semana', '💰', 'revenue', 2000, 'weekly', 120, 3),
  ('monthly_revenue_10k', 'Cinco Dígitos no Mês', 'Fature R$ 10.000 no mês', '💎', 'revenue', 10000, 'monthly', 300, 4),
  ('monthly_margin_30', 'Margem Acima de 30%', 'Mantenha margem acima de 30% no mês', '📈', 'margin_pct', 30, 'monthly', 200, 5);

-- ============== user_challenges
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_code TEXT NOT NULL REFERENCES public.challenges_catalog(code),
  period_start DATE NOT NULL,
  progress NUMERIC NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_code, period_start)
);

CREATE INDEX user_challenges_user_idx ON public.user_challenges(user_id);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User challenges: select own" ON public.user_challenges FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User challenges: insert own" ON public.user_challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User challenges: update own" ON public.user_challenges FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============== goals
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.goal_type NOT NULL,
  target_value NUMERIC(12,2) NOT NULL,
  period public.goal_period NOT NULL DEFAULT 'month',
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  achieved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX goals_user_idx ON public.goals(user_id);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Goals: select own" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Goals: insert own" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Goals: update own" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Goals: delete own" ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);