
-- 1. has_role: switch to SECURITY INVOKER (user_roles has RLS "read own", so
-- checking auth.uid()'s own role still works; checking other users returns false).
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2. handle_new_user is a trigger; nothing legitimate calls it via the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3. Restrict which profile columns authenticated users can update directly.
--    Sensitive columns (billing/trial/gamification) must be changed only by
--    trusted server code using the service role.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  full_name,
  business_name,
  profession_type,
  monthly_goal,
  onboarding_completed,
  updated_at
) ON public.profiles TO authenticated;

-- 4. user_achievements: revoke direct insert; achievements are granted by
--    trusted server code.
REVOKE INSERT ON public.user_achievements FROM authenticated;

DROP POLICY IF EXISTS "User achievements: insert own" ON public.user_achievements;
