-- Add profile fields for user customization
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();

-- Create index for faster user searches
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);