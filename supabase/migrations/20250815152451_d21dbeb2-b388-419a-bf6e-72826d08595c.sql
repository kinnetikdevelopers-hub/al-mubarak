-- Fix security warnings by setting search_path for functions

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role app_role;
    user_status user_status;
BEGIN
    -- Check if email is admin
    IF NEW.email IN ('dreykojr97@gmail.com', 'abdikhalil954@gmail.com') THEN
        user_role := 'admin';
        user_status := 'approved';
    ELSE
        user_role := 'tenant';
        user_status := 'pending';
    END IF;

    -- Insert into profiles
    INSERT INTO public.profiles (id, email, role, status)
    VALUES (NEW.id, NEW.email, user_role, user_status);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;