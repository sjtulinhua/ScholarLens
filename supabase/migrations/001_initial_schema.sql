-- ============================================
-- ScholarLens 数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 启用 pgvector 扩展（用于相似题检索）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. 用户档案表 (profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'parent', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 当新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器：用户注册后自动创建 profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. 邀请码表 (invitation_codes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 插入初始邀请码（请修改为您自己的邀请码）
INSERT INTO public.invitation_codes (code) VALUES 
  ('SCHOLAR2026'),
  ('XIAMEN2026'),
  ('MATHSTAR')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. 考试/试卷表 (exams)
-- ============================================
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'chinese', 'physics', 'chemistry', 'politics', 'history')),
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 创建索引加快查询
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject);

-- ============================================
-- 4. 题目表 (questions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'chinese', 'physics', 'chemistry', 'politics', 'history')),
  knowledge_points JSONB DEFAULT '[]'::jsonb NOT NULL,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  is_reference BOOLEAN DEFAULT false NOT NULL,
  meta_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_is_reference ON public.questions(is_reference);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);

-- 创建向量索引（用于相似题检索）
CREATE INDEX IF NOT EXISTS idx_questions_embedding ON public.questions
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 5. 错题记录表 (mistakes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_type TEXT CHECK (error_type IN (
    'calculation_error',
    'concept_confusion', 
    'reading_error',
    'method_error',
    'auxiliary_line_error',
    'template_missing',
    'keyword_missing',
    'other'
  )),
  error_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON public.mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_question_id ON public.mistakes(question_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_created_at ON public.mistakes(created_at DESC);

-- ============================================
-- 6. 练习记录表 (practice_records)
-- ============================================
CREATE TABLE IF NOT EXISTS public.practice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  variant_content TEXT NOT NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_practice_records_user_id ON public.practice_records(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_records_created_at ON public.practice_records(created_at DESC);

-- ============================================
-- 完成提示
-- ============================================
-- 执行完毕后，请继续执行 002_rls_policies.sql 设置行级安全策略
