-- Create profiles table for team members
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - authenticated users can see all team members
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Leads table (potential clients)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_name TEXT NOT NULL,
  owner_name TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all leads" 
ON public.leads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create leads" 
ON public.leads FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads" 
ON public.leads FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete leads" 
ON public.leads FOR DELETE TO authenticated USING (true);

-- Clients table (active clients)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  salon_name TEXT NOT NULL,
  owner_name TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  facebook_page TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  contract_start_date DATE,
  monthly_budget DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all clients" 
ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create clients" 
ON public.clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" 
ON public.clients FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete clients" 
ON public.clients FOR DELETE TO authenticated USING (true);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active',
  objective TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all campaigns" 
ON public.campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create campaigns" 
ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns" 
ON public.campaigns FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete campaigns" 
ON public.campaigns FOR DELETE TO authenticated USING (true);

-- Campaign metrics table
CREATE TABLE public.campaign_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all metrics" 
ON public.campaign_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create metrics" 
ON public.campaign_metrics FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update metrics" 
ON public.campaign_metrics FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete metrics" 
ON public.campaign_metrics FOR DELETE TO authenticated USING (true);

-- Documents table (generated reports, invoices, etc.)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  data JSONB NOT NULL,
  thumbnail TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all documents" 
ON public.documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create documents" 
ON public.documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents" 
ON public.documents FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete documents" 
ON public.documents FOR DELETE TO authenticated USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();