-- ============================================
-- 008_add_mistake_status.sql
-- 补全 mistakes 表缺失的 status 字段
-- ============================================

-- 添加 status 字段，默认值为 'active'
ALTER TABLE public.mistakes
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived', 'corrected'));

-- 刷新注释
COMMENT ON COLUMN public.mistakes.status IS '错题状态 (active=待解决, resolved=已掌握, archived=搁置)';
