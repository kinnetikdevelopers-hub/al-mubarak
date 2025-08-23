-- Fix security warning: Set search_path for function by recreating it properly
DROP TRIGGER IF EXISTS update_profiles_display_name ON public.profiles;
DROP FUNCTION IF EXISTS public.update_display_name() CASCADE;

CREATE OR REPLACE FUNCTION public.update_display_name()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
        NEW.display_name = TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    END IF;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_profiles_display_name
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_display_name();