
-- Free-access emails managed by admins. Users who sign up with one of these
-- emails get the app for free (plan='free', subscription_status='active').

CREATE TABLE public.free_access_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Normalize email to lowercase
CREATE OR REPLACE FUNCTION public.normalize_free_access_email()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_free_access_email
  BEFORE INSERT OR UPDATE ON public.free_access_emails
  FOR EACH ROW EXECUTE FUNCTION public.normalize_free_access_email();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.free_access_emails TO authenticated;
GRANT ALL ON public.free_access_emails TO service_role;

ALTER TABLE public.free_access_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view free access emails"
  ON public.free_access_emails FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert free access emails"
  ON public.free_access_emails FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update free access emails"
  ON public.free_access_emails FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete free access emails"
  ON public.free_access_emails FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user: if email is in free list, grant free plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_free boolean;
BEGIN
  is_free := EXISTS (
    SELECT 1 FROM public.free_access_emails
    WHERE email = lower(NEW.email)
  );

  INSERT INTO public.profiles (
    id, email, full_name, plan,
    trial_started_at, trial_ends_at, subscription_status,
    subscription_started_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN is_free THEN 'free' ELSE 'trial' END,
    now(),
    now() + interval '7 days',
    CASE WHEN is_free THEN 'active' ELSE 'trialing' END,
    CASE WHEN is_free THEN now() ELSE NULL END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  IF lower(NEW.email) = 'metodomontadorlucrativo@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill: any existing user whose email is in the free list should be 'free'/'active'
-- (no-op now since list is empty, but kept for future inserts via admin only).
