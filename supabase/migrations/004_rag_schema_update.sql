-- ============================================
-- 004_rag_schema_update.sql
-- 难度基准库 RAG 升级
-- ============================================

-- 1. 更新 questions 表，支持 Gemini text-embedding-004
-- 注意：text-embedding-004 维度为 768
-- 先删除旧索引（如果存在）
DROP INDEX IF EXISTS idx_questions_embedding;

-- 修改 embedding 列维度
ALTER TABLE public.questions 
  ALTER COLUMN embedding TYPE vector(768);

-- 添加 RAG 所需字段
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS official_year TEXT; -- 例如 'Xiamen-2024'

-- 确保 is_reference 存在（001中已包含，这里作为双保险或更新默认值）
ALTER TABLE public.questions 
  ALTER COLUMN is_reference SET DEFAULT false;

-- 2. 重建向量索引
-- 使用 inner product (或者 cosine distance) 
-- cosine distance 更适合标准化后的向量
CREATE INDEX idx_questions_embedding ON public.questions
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. 创建相似度搜索函数
-- Supabase RPC 函数，用于通过 embedding 查找最近邻
CREATE OR REPLACE FUNCTION match_reference_questions (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_subject text
)
RETURNS TABLE (
  id uuid,
  content text,
  difficulty integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.content,
    q.difficulty,
    1 - (q.embedding <=> query_embedding) as similarity
  FROM questions q
  WHERE 1 - (q.embedding <=> query_embedding) > match_threshold
  AND q.is_reference = true
  AND q.subject = filter_subject
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
