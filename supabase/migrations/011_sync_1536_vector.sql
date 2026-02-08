-- 1. 调整 questions 表的向量维度
ALTER TABLE questions ALTER COLUMN embedding TYPE vector(1536);

-- 2. 更新个人查重函数 (match_user_questions)
CREATE OR REPLACE FUNCTION public.match_user_questions(
  query_embedding vector(1536), 
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
  query_embedding vector(1536), 
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
