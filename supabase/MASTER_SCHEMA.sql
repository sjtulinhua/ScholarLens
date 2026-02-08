-- ============================================
-- ScholarLens 全量 Master Schema (2026-02-08)
-- 包含：表结构、RLS 策略、函数、存储桶配置
-- ============================================

-- 0. 基础设置
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. 表结构 (Tables)
-- ============================================

-- 1.1 用户档案表 (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'parent', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.2 邀请码表 (invitation_codes)
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.3 考试/试卷表 (exams)
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('math', 'chinese', 'physics', 'chemistry', 'politics', 'history')),
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.4 题目表 (questions)
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
  official_year TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  error_type TEXT,
  error_analysis TEXT,
  meta_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  embedding VECTOR(1536), -- 统一 1536 维度
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.5 错题记录表 (mistakes)
CREATE TABLE IF NOT EXISTS public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived', 'corrected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.6 练习记录表 (practice_records)
CREATE TABLE IF NOT EXISTS public.practice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  variant_content TEXT NOT NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.7 知识库/名词解释 (knowledge_base)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    definition TEXT NOT NULL,
    tips JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. 索引 (Indexes)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON public.exams(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_occurred_at ON public.questions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_embedding ON public.questions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON public.mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_name ON public.knowledge_base(name);

-- ============================================
-- 3. 函数与触发器 (Functions & Triggers)
-- ============================================

-- 3.1 用户注册自动创建 Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.2 自动更新 timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_base_modtime
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ============================================
-- 4. RPC 搜索函数 (Search Functions)
-- ============================================

-- 4.1 个人查重函数
CREATE OR REPLACE FUNCTION public.match_user_questions(
  query_embedding vector(1536), 
  match_threshold double precision, 
  match_count integer, 
  user_uuid uuid
)
RETURNS TABLE(id uuid, content text, similarity double precision) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.content,
    (1 - (q.embedding <=> query_embedding))::float as similarity
  FROM questions q
  WHERE 1 - (q.embedding <=> query_embedding) > match_threshold
  AND q.user_id = user_uuid
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4.2 基准库/题目检索函数
CREATE OR REPLACE FUNCTION public.match_reference_questions(
  query_embedding vector(1536), 
  match_threshold double precision, 
  match_count integer, 
  filter_subject text
)
RETURNS TABLE(id uuid, content text, difficulty integer, similarity double precision) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.content,
    q.difficulty,
    (1 - (q.embedding <=> query_embedding))::float as similarity
  FROM questions q
  WHERE 1 - (q.embedding <=> query_embedding) > match_threshold
  AND q.is_reference = true
  AND q.subject = filter_subject
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- 5. RLS 策略 (Security Policies)
-- ============================================

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- 极简策略定义
CREATE POLICY "Profiles: read own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Invitations: anyone read" ON public.invitation_codes FOR SELECT USING (true);

CREATE POLICY "Exams: CRUD own" ON public.exams FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Questions: read own/ref" ON public.questions FOR SELECT USING (auth.uid() = user_id OR is_reference = true);
CREATE POLICY "Questions: insert own" ON public.questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Questions: update own" ON public.questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Questions: delete own" ON public.questions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Mistakes: CRUD own" ON public.mistakes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Practice: CRUD own" ON public.practice_records FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Knowledge: read public" ON public.knowledge_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "Knowledge: system insert" ON public.knowledge_base FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 6. 存储桶配置 (Storage Setup)
-- ============================================

-- 创建桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-images', 'exam-images', true) -- 设为公有以便渲染
ON CONFLICT (id) DO UPDATE SET public = true;

-- 允许上传与删除
CREATE POLICY "Storage: CRUD own" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'exam-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'exam-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 公开读取
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'exam-images' );

-- ============================================
-- 7. 初始数据 (Seed Data)
-- ============================================
INSERT INTO public.invitation_codes (code) VALUES 
  ('SCHOLAR2026'),
  ('XIAMEN2026'),
  ('MATHSTAR')
ON CONFLICT (code) DO NOTHING;
