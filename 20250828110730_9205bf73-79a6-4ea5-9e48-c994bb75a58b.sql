-- Add lease document fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN lease_document_url TEXT,
ADD COLUMN lease_document_name TEXT,
ADD COLUMN lease_document_size INTEGER,
ADD COLUMN lease_document_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Create receipts table for tracking generated receipts
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  unit_number TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on receipts table
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for receipts
CREATE POLICY "Admins can manage all receipts" 
ON public.receipts 
FOR ALL 
USING (is_admin());

CREATE POLICY "Tenants can view their own receipts" 
ON public.receipts 
FOR SELECT 
USING (auth.uid() = tenant_id);

-- Create invoices table for tracking generated invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  billing_month_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  unit_number TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Admins can manage all invoices" 
ON public.invoices 
FOR ALL 
USING (is_admin());

CREATE POLICY "Tenants can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = tenant_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add user preferences table for theme settings
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for updated_at column
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
