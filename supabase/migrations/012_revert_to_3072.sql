-- 012_revert_to_3072.sql
-- 鉴于该环境下的 gemini-embedding-001 返回 3072 维，我们将数据库重新对齐到 3072。

-- 1. 调整 questions 表的向量维度
-- 注意：这可能需要清空现有数据以避免维度冲突，或者保持为 NULL。
-- TRUNCATE TABLE questions CASCADE; -- 如果您想彻底重来
ALTER TABLE questions ALTER COLUMN embedding TYPE vector(3072);

-- 2. 更新个人查重函数 (match_user_questions)
CREATE OR REPLACE FUNCTION public.match_user_questions(
  query_embedding vector(3072), 
  match_threshold double precision, 
  match_count integer, 
  user_uuid uuid
)
RETURNS TABLE(id uuid, content text, similarity double precision) 
LANGUAGE plpgsql
AS $function$
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
$function$;

-- 3. 更新基准库匹配函数 (match_reference_questions)
CREATE OR REPLACE FUNCTION public.match_reference_questions(
  query_embedding vector(3072), 
  match_threshold double precision, 
  match_count integer, 
  filter_subject text
)
RETURNS TABLE(id uuid, content text, difficulty integer, similarity double precision) 
LANGUAGE plpgsql
AS $function$
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
$function$;
