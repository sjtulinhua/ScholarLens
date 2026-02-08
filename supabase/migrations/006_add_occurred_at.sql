-- ============================================
-- 006_add_occurred_at.sql
-- 增加“发生时间/做题时间”字段，用于并支持历史数据补录
-- ============================================

-- 1. 添加 occurred_at 字段，默认值为当前时间
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- 2. 补全旧数据：将 created_at 的值复制给 occurred_at（针对已存在的历史错题）
UPDATE public.questions
SET occurred_at = created_at;

-- 3. 创建索引（用于按做题时间查询趋势）
CREATE INDEX IF NOT EXISTS idx_questions_occurred_at ON public.questions(occurred_at DESC);

-- 4. 刷新注释
COMMENT ON COLUMN public.questions.occurred_at IS '错题发生时间 (Backdating Support)';
