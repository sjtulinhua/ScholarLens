-- Add deleted_at column for soft delete
ALTER TABLE public.mistakes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for performance when filtering out deleted items
CREATE INDEX IF NOT EXISTS idx_mistakes_deleted_at ON public.mistakes(deleted_at);

-- Comments
COMMENT ON COLUMN public.mistakes.deleted_at IS 'Soft delete timestamp. If NULL, the record is active.';
