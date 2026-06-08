
-- 1) Estender enum app_plan
ALTER TYPE public.app_plan ADD VALUE IF NOT EXISTS 'trial';
ALTER TYPE public.app_plan ADD VALUE IF NOT EXISTS 'start';
ALTER TYPE public.app_plan ADD VALUE IF NOT EXISTS 'infinit';

-- 2) Adicionar colunas de assinatura
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS cancel_requested_at timestamptz;

-- 3) Backfill: usuários existentes ganham trial a partir de agora se ainda não tiverem
UPDATE public.profiles
SET trial_started_at = COALESCE(trial_started_at, now()),
    trial_ends_at = COALESCE(trial_ends_at, now() + interval '7 days'),
    subscription_status = COALESCE(NULLIF(subscription_status, ''), 'trialing');

-- 4) Atualizar handle_new_user para iniciar trial automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, plan,
    trial_started_at, trial_ends_at, subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'trial',
    now(),
    now() + interval '7 days',
    'trialing'
  );
  RETURN NEW;
END;
$function$;
