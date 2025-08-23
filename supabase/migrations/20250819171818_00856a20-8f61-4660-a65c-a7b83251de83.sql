-- Update payments table to support partial status
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS partial_amount numeric DEFAULT NULL;