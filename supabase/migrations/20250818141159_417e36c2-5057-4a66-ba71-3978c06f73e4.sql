-- Create units table
CREATE TABLE public.units (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_number TEXT NOT NULL,
    floor TEXT NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance')),
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(unit_number)
);

-- Create billing_months table
CREATE TABLE public.billing_months (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    payment_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(month, year)
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    billing_month_id UUID NOT NULL REFERENCES public.billing_months(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    mpesa_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, billing_month_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for units
CREATE POLICY "Admins can manage all units" ON public.units FOR ALL USING (is_admin());
CREATE POLICY "Tenants can view their own unit" ON public.units FOR SELECT USING (auth.uid() = tenant_id);

-- RLS Policies for billing_months
CREATE POLICY "Admins can manage billing months" ON public.billing_months FOR ALL USING (is_admin());
CREATE POLICY "Tenants can view billing months" ON public.billing_months FOR SELECT USING (true);

-- RLS Policies for payments
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (is_admin());
CREATE POLICY "Tenants can manage their own payments" ON public.payments FOR ALL USING (auth.uid() = tenant_id);

-- RLS Policies for notifications
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT USING (is_admin());
CREATE POLICY "Tenants can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Tenants can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = tenant_id);

-- Create triggers for updated_at
CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_months_updated_at
    BEFORE UPDATE ON public.billing_months
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();