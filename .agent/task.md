# ScholarLens MVP 开发任务

## Phase 1: Planning ✅
- [x] 理解用户需求和背景
- [x] 确认科目优先级和使用场景
- [x] 确认用户模型（多账号、家庭共用）
- [x] 用户选择方案 → **方案 B：标准 MVP**
- [x] 创建实施计划 → 用户已批准

## Phase 2: Week 1 - 基础架构 + 认证
- [x] 项目初始化 (Next.js 15 + TypeScript + Tailwind)
- [x] Shadcn/ui 配置
- [x] Supabase 配置 (Client + Server)
- [x] 数据库迁移脚本 (3个文件: schema, RLS, storage)
- [x] **用户操作**: npm install + 配置 .env.local + 执行 SQL 迁移
- [x] 认证页面 (登录 + 邀请码注册)
- [x] 上传页面 (图片选择 + 预览)
- [x] Week 1 基础架构验收 (注册/登录/上传界面打通)

## Phase 3: Week 2 - AI 集成 + 仪表盘
- [x] AI 服务基础 (Gemini + DeepSeek 封装)
- [x] 图片上传到 Supabase Storage
- [x] 错题分析逻辑 (Prompt + 解析)
- [x] 首页仪表盘 (雷达图)
- [x] 错题本页面 (列表、预览)
- [x] 错题分析 Server Action
- [x] Week 2 验收 (AI 分析与可视化流程闭环)

## Phase 3.5: Week 2.5 - UI/UX 优化与性能增强
- [x] 修复 Dashboard 底部按钮悬停对比度
- [x] 仪表盘数据查询并行化 (性能优化)
- [x] 引入 Loading 页面提升导航感官速度
- [x] 错题本卡片视觉微调

## Phase 3.6: AI 调优与数据基准 (AI Tuning)
## Phase 3.6: AI 调优与数据基准 (AI Tuning)
- [x] 优化 Prompt 以识别批改痕迹 (红叉/圈选)
- [x] 基准库上传页 (支持 PDF/Image)
- [x] Word 文档兼容性处理 (UI 提示转 PDF)
- [x] 建立“难度基准库” (RAG Pipeline)
  - [x] Schema Update: `is_reference`, `official_year`, `embedding` (768维)
  - [x] API `api/admin/upload-reference`: 解析真题 PDF -> 切分题目 -> 生成 Embedding
  - [x] Analysis Update: 相似题检索 (Top 3) -> Few-Shot Prompt 注入

## Phase 4: Week 3 - 变式题 + 优化
- [x] 变式题生成 (lib/ai/variant.ts)
- [x] 练习页面 (app/practice/page.tsx) [Gemini 3.0 Pro]
- [x] **Debugging**: 修复 Gemini API 404 (IPv6 Leak) -> 升级至 Gemini 3.0 Pro
- [x] **Debugging**: 修复向量维度冲突 (768->3072) -> 数据库升级至 3072 维
- [x] **Enhancement**: 支持多图/多PDF同时上传
- [x] **Debugging**: 增强 JSON 解析鲁棒性 (解决 "AI 返回格式错误")
- [x] **UI Fix**: 修复基准库列表不显示的问题
- [x] **UX Enhancement**: 基准库支持“点击查看详情”与“多维分类归档”
- [x] **UI Polish (Soft Professional / Linear Light)**:
  - [x] 全局主题切换: Dark -> Light (Linear Light)
  - [ ] `globals.css` 调优: 调整系统色板 (Zinc/Slate), 增加 Clean Borders
  - [ ] 字体优化: 延续 Inter/Mono 组合
  - [x] 组件美化: 去除过多圆角，强调线条感与专业度
  - [x] 关键页面重构: 首页 Dashboard, 基准库列表, 认证页
  - [ ] **[Backlog]** 首页趋势图支持科目筛选 (Dashboard Subject Filter)
  - [ ] **[Backlog]** 消灭进度趋势图 (Growth/Mastery Trend Chart)
  - [ ] **[Backlog]** 知识点“红黄绿灯”分级诊断 (KP Health Analysis)
- [x] 移动端适配 (Responsive)
  - [x] 基础布局响应式优化
  - [x] 针对 iPad Pro (11-inch) 优化布局
  - [x] 针对 iPhone 15 Pro Max 优化触控体验
- [ ] 部署到 Zeabur (待本地充分测试后执行)
