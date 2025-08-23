-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'tenant');

-- Create user status enum  
CREATE TYPE public.user_status AS ENUM ('pending', 'approved', 'suspended');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    id_number TEXT,
    role app_role NOT NULL,
    status user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user registration
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR ALL 
    USING (public.is_admin());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();