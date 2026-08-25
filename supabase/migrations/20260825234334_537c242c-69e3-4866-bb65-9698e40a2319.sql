CREATE TYPE public.service_period AS ENUM ('day', 'week', 'month');

ALTER TABLE public.services
ADD COLUMN period public.service_period NOT NULL DEFAULT 'month';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;

DROP POLICY IF EXISTS "Services: update own" ON public.services;
CREATE POLICY "Services: update own"
ON public.services
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Expenses: update own" ON public.expenses;
CREATE POLICY "Expenses: update own"
ON public.expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Goals: update own" ON public.goals;
CREATE POLICY "Goals: update own"
ON public.goals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);