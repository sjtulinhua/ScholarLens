-- ============================================
-- ScholarLens Storage Bucket 配置
-- 用于存储用户上传的试卷图片
-- ============================================

-- 创建 exam-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-images', 'exam-images', false)
ON CONFLICT (id) DO NOTHING;

-- 允许已认证用户上传图片到自己的文件夹
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exam-images' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 允许用户读取自己的图片
CREATE POLICY "Users can read own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exam-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 允许用户删除自己的图片
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exam-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
