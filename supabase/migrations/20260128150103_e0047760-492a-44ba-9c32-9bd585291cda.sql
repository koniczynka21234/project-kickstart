-- Add contract period tracking fields to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contract_end_date date,
ADD COLUMN IF NOT EXISTS contract_duration_months integer DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.contract_end_date IS 'End date of the current contract';
COMMENT ON COLUMN public.clients.contract_duration_months IS 'Duration of the contract in months (default 1 for monthly contracts)';