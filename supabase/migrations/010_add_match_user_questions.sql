-- 增加通用查重函数
CREATE OR REPLACE FUNCTION match_user_questions (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  user_uuid uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.content,
    1 - (q.embedding <=> query_embedding) as similarity
  FROM questions q
  WHERE 1 - (q.embedding <=> query_embedding) > match_threshold
  AND q.user_id = user_uuid
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
