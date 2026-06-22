-- Auto-create user_profile when new user signs up
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role'), 'store_owner')::public.user_role
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- Auto-create default store when store_owner profile is created
CREATE OR REPLACE FUNCTION public.fn_create_default_store()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'store_owner' THEN
    INSERT INTO public.stores (owner_id, name, phone)
    VALUES (NEW.id, NEW.full_name || '''s Store', NEW.phone);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on user_profiles insert
CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_create_default_store();
