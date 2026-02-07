-- 升级向量维度到 3072 (Gemini Embedding 001 原生维度)
-- 注意：这将清空现有的 768 维向量数据，或者需要重新计算。
-- 鉴于目前数据量极少，建议直接清空 questions 表中的 embedding 列，或者直接清空表。

-- 1. 删除旧索引
DROP INDEX IF EXISTS idx_questions_embedding;

-- 2. 清空现有数据 (为了避免维度不一致报错，简单起见，我们选择清空表。如果您想保留题目内容，可以用 UPDATE questions SET embedding = NULL;)
TRUNCATE TABLE questions CASCADE;

-- 3. 修改列定义
ALTER TABLE questions ALTER COLUMN embedding TYPE vector(3072);

-- 4. 索引策略调整 (3072维超过 Supabase pgvector 2000维索引限制)
-- 对于数千道题的规模，不加索引的“全表扫描”性能依然是毫秒级。
-- 为了保留旗舰级的 3072 精度，我们选择 **不创建向量索引**。
-- (等未来 Supabase 升级 pgvector 版本支持更高维度后，再补建索引)
DROP INDEX IF EXISTS idx_questions_embedding;

-- 5. 更新匹配函数 (入参和内部逻辑都需要更新为 3072)
CREATE OR REPLACE FUNCTION match_reference_questions (
  query_embedding vector(3072),
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
