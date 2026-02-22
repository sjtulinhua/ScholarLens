-- Migration: Remove CHECK constraints on subject columns
-- Subject validation is now handled at the application layer (src/lib/subjects.ts)
-- This makes adding new subjects a code-only change with no DB migration needed.

ALTER TABLE public.exams DROP CONSTRAINT IF EXISTS exams_subject_check;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_subject_check;
