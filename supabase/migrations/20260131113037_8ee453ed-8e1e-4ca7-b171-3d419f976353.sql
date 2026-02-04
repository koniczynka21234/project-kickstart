-- Add contract_amount column for agency fee (kwota współpracy)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contract_amount numeric NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.clients.contract_amount IS 'Monthly agency fee / kwota współpracy (PLN)';