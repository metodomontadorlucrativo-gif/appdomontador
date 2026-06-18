CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    (CASE WHEN is_free THEN 'free' ELSE 'trial' END)::public.app_plan,
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
$function$;