-- ============================================
-- ScholarLens 行级安全策略 (RLS)
-- 确保用户只能访问自己的数据
-- ============================================

-- ============================================
-- 1. profiles 表 RLS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能读取自己的 profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 用户只能更新自己的 profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. invitation_codes 表 RLS
-- ============================================
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- 任何人都可以检查邀请码是否有效（用于注册验证）
CREATE POLICY "Anyone can check invitation codes"
  ON public.invitation_codes FOR SELECT
  USING (true);

-- 只有已认证用户可以使用邀请码
CREATE POLICY "Authenticated users can use invitation codes"
  ON public.invitation_codes FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_used = false)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 3. exams 表 RLS
-- ============================================
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的试卷
CREATE POLICY "Users can read own exams"
  ON public.exams FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的试卷
CREATE POLICY "Users can create own exams"
  ON public.exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的试卷
CREATE POLICY "Users can update own exams"
  ON public.exams FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的试卷
CREATE POLICY "Users can delete own exams"
  ON public.exams FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. questions 表 RLS
-- ============================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的题目 + 公共参考题（is_reference = true）
CREATE POLICY "Users can read own questions and reference questions"
  ON public.questions FOR SELECT
  USING (auth.uid() = user_id OR is_reference = true);

-- 用户只能创建自己的题目
CREATE POLICY "Users can create own questions"
  ON public.questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的题目
CREATE POLICY "Users can update own questions"
  ON public.questions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的题目
CREATE POLICY "Users can delete own questions"
  ON public.questions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. mistakes 表 RLS
-- ============================================
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的错题记录
CREATE POLICY "Users can read own mistakes"
  ON public.mistakes FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的错题记录
CREATE POLICY "Users can create own mistakes"
  ON public.mistakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的错题记录
CREATE POLICY "Users can update own mistakes"
  ON public.mistakes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的错题记录
CREATE POLICY "Users can delete own mistakes"
  ON public.mistakes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. practice_records 表 RLS
-- ============================================
ALTER TABLE public.practice_records ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的练习记录
CREATE POLICY "Users can read own practice records"
  ON public.practice_records FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的练习记录
CREATE POLICY "Users can create own practice records"
  ON public.practice_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的练习记录
CREATE POLICY "Users can update own practice records"
  ON public.practice_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的练习记录
CREATE POLICY "Users can delete own practice records"
  ON public.practice_records FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 完成提示
-- ============================================
-- RLS 策略设置完毕！
-- 现在每个用户只能访问自己的数据，账号间完全隔离。
