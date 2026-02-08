-- Create knowledge_base table for caching AI definitions
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    definition TEXT NOT NULL,
    tips JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexing for fast lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_base_name ON public.knowledge_base(name);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read (it's a shared cache)
CREATE POLICY "Allow public read of knowledge_base"
ON public.knowledge_base FOR SELECT
TO authenticated
USING (true);

-- Allow system/authenticated users to insert (first one to request caches it)
CREATE POLICY "Allow authenticated insert of knowledge_base"
ON public.knowledge_base FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_base_modtime
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
