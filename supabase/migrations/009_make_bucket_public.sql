-- ============================================
-- 009_make_bucket_public.sql
-- 将 exam-images 存储桶设为公开，解决 Next.js Image Optimization 400 错误
-- ============================================

-- 更新 bucket 为 public
UPDATE storage.buckets
SET public = true
WHERE id = 'exam-images';

-- 确保允许公开读取 (Review existing policy)
-- 之前的策略是 "Users can read own images" (auth.uid() = foldername)
-- 为了让 Next.js 服务器能读取（或者分享给老师），我们需要放宽读取权限
-- 或者保持现状，但 Next.js 优化器可能需要 token (比较麻烦)。
-- 最简单的方案：允许公开读取 exam-images 下的所有文件 (既然是 Public Bucket)

DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'exam-images' );
