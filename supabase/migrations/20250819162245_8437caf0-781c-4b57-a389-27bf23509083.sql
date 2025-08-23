-- Add additional profile fields for enhanced signup
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS id_number_full TEXT;

-- Update payments table to support new payment statuses
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add partial status to payments
ALTER TABLE public.payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'paid', 'partial', 'failed'));

-- Update billing_months to support edit/delete functionality
ALTER TABLE public.billing_months 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create trigger to update profiles display_name when first_name or last_name changes
CREATE OR REPLACE FUNCTION public.update_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
        NEW.display_name = TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_display_name
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_display_name();