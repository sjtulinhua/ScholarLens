-- ============================================
-- 007_add_analysis_cols.sql
-- 补全 questions 表缺失的分析字段
-- ============================================

-- 添加 error_type 和 error_analysis 字段
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS error_type TEXT,
ADD COLUMN IF NOT EXISTS error_analysis TEXT;

-- 刷新注释
COMMENT ON COLUMN public.questions.error_type IS '错因类型 (Calculated Error, Concept Confusion etc.)';
COMMENT ON COLUMN public.questions.error_analysis IS 'AI 生成的详细错因分析';
