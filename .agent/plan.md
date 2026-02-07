# ScholarLens MVP 实施计划

> 选定方案：**标准 MVP**
> 预计周期：**3 周**
> 开始时间：2026-02-06

---

## 用户审核事项

> [!IMPORTANT]
> 以下设计决策需要您确认：

1. **AI 模型选择**：数学/理科用 Gemini 1.5 Pro，语文用 DeepSeek V3，是否同意？
2. **图片存储**：使用 Supabase Storage（免费额度 1GB），是否足够？
3. **部署平台**：Zeabur（后端） + Vercel（前端），还是全部 Zeabur？

---

## 页面结构

```
ScholarLens/
├── / (首页 - 仪表盘)
│   ├── 知识点雷达图
│   ├── 最近错题列表
│   └── 快速上传入口
│
├── /upload (上传页)
│   ├── 拍照/选择图片
│   ├── 选择科目
│   └── AI 分析进度
│
├── /mistakes (错题本)
│   ├── 按科目筛选
│   ├── 按知识点筛选
│   └── 错题卡片列表
│
├── /practice (练习页)
│   ├── 选择薄弱知识点
│   ├── 变式题展示
│   └── 答题与反馈
│
├── /auth (认证)
│   ├── /login
│   └── /register (邀请码)
│
└── /settings (设置)
    └── 账号信息
```

---

## 技术架构

### 技术栈
| 层 | 技术 |
|---|------|
| 前端 | Next.js 15 (App Router) + TypeScript |
| 样式 | Tailwind CSS + Shadcn/ui (Dark Mode) |
| 数据库 | Supabase (PostgreSQL + pgvector) |
| 认证 | Supabase Auth + RLS |
| AI | Gemini 1.5 Pro (理科) / DeepSeek V3 (文科) |
| 部署 | Zeabur |

### 数据库 Schema

```sql
-- 用户档案
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 邀请码
CREATE TABLE invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 考试/试卷
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  subject TEXT NOT NULL, -- 'math', 'chinese', 'physics', 'chemistry'
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 错题
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams,
  user_id UUID NOT NULL REFERENCES auth.users,
  content TEXT NOT NULL, -- Markdown 格式
  images JSONB DEFAULT '[]', -- 图片 URL 数组
  subject TEXT NOT NULL,
  knowledge_points JSONB DEFAULT '[]', -- 知识点标签
  error_type TEXT, -- 错因类型
  error_analysis TEXT, -- AI 错因分析
  difficulty INTEGER DEFAULT 3, -- 1-5
  meta_data JSONB DEFAULT '{}', -- 科目特定元数据
  embedding VECTOR(768), -- Gemini text-embedding-004 维度
  is_reference BOOLEAN DEFAULT false, -- [NEW] 是否为基准真题
  official_year TEXT, -- [NEW] 如 'Xiamen-2024'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 变式题练习记录
CREATE TABLE practice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  question_id UUID REFERENCES questions,
  variant_content TEXT, -- AI 生成的变式题
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略（每个表都加）
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own questions"
  ON questions FOR ALL USING (auth.uid() = user_id);
```

---

## 开发阶段

### Week 1：基础架构 + 认证 + 上传

| 任务 | 文件 | 说明 |
|------|------|------|
| 项目初始化 | `npx create-next-app` | Next.js 15 + TypeScript |
| Supabase 配置 | `lib/supabase.ts` | 客户端 + 服务端 |
| 数据库迁移 | `supabase/migrations/` | 上述 Schema |
| 认证页面 | `app/auth/` | 登录 + 邀请码注册 |
| 上传页面 | `app/upload/` | 图片上传 + 科目选择 |
| 图片存储 | Supabase Storage | 配置 bucket + 上传逻辑 |

#### [NEW] 新建文件
- [app/layout.tsx](file:///d:/Antigravity%20WS/ScholarLens/app/layout.tsx) - 根布局
- [app/page.tsx](file:///d:/Antigravity%20WS/ScholarLens/app/page.tsx) - 首页
- [app/auth/login/page.tsx](file:///d:/Antigravity%20WS/ScholarLens/app/auth/login/page.tsx) - 登录页
- [app/auth/register/page.tsx](file:///d:/Antigravity%20WS/ScholarLens/app/auth/register/page.tsx) - 注册页
- [app/upload/page.tsx](file:///d:/Antigravity%20WS/ScholarLens/app/upload/page.tsx) - 上传页
- [lib/supabase/client.ts](file:///d:/Antigravity%20WS/ScholarLens/lib/supabase/client.ts) - Supabase 客户端
- [lib/supabase/server.ts](file:///d:/Antigravity%20WS/ScholarLens/lib/supabase/server.ts) - Supabase 服务端

---

### Week 2：AI 集成 + 仪表盘

| 任务 | 文件 | 说明 |
|------|------|------|
| Gemini 集成 | `lib/ai/gemini.ts` | 使用 `@google/generative-ai` 处理理科题目图片 |
| DeepSeek 集成 | `lib/ai/deepseek.ts` | 处理文科题目分析 |
| AI 调度与 Prompt | `lib/ai/service.ts`, `lib/ai/prompts.ts` | 根据科目选择模型与 Prompt，结构化 JSON 输出 |
| 图片存储逻辑 | `lib/supabase/storage.ts` | 上传至 `exam-images` 存储桶，支持 RLS |
| 错题分析 Action | `app/upload/actions.ts` | 串联上传、AI 分析、数据库保存的全流程 |
| 仪表盘 | `app/page.tsx` | 使用 `recharts` 实现知识点雷达图 + 活跃错题列表 |
| 错题本 | `app/mistakes/` | 支持科目筛选与多维度的错题浏览 |

#### AI 分析工作流
1. 用户选择图片与科目，点击“开始分析”。
2. 前端调用 Server Action。
3. 图片保存到 Supabase Storage。
4. 调用相应 AI 模型（Gemini 1.5 Pro / DeepSeek V3）进行多模态分析。
5. 解析 AI 返回的 JSON 数据。
6. 将数据持久化到 `questions` 与 `mistakes` 表。

#### AI Prompt 模板

```typescript
// 数学错题分析 Prompt
const MATH_ANALYSIS_PROMPT = `
你是一名厦门初中数学名师，熟悉《厦门市初中数学教学质量监测》标准。

请分析以下错题图片，返回 JSON 格式：
{
  "content": "题目内容（Markdown格式，数学公式用LaTeX）",
  "knowledge_points": ["圆-垂径定理", "二次函数-顶点式"],
  "error_type": "计算错误|概念混淆|审题不清|方法错误",
  "error_analysis": "详细错因分析",
  "difficulty": 3, // 1-5
  "meta_data": {
    "formula_tags": ["quadratic"],
    "graph_type": "parabola"
  }
}
`;
```

#### [NEW] 新建文件
- [lib/ai/gemini.ts](file:///d:/Antigravity%20WS/ScholarLens/lib/ai/gemini.ts) - Gemini API 封装
- [lib/ai/deepseek.ts](file:///d:/Antigravity%20WS/ScholarLens/lib/ai/deepseek.ts) - DeepSeek API 封装
- [lib/ai/prompts.ts](file:///d:/Antigravity%20WS/ScholarLens/lib/ai/prompts.ts) - Prompt 模板
- [app/api/analyze/route.ts](file:///d:/Antigravity%20WS/ScholarLens/app/api/analyze/route.ts) - 分析 API
- [app/mistakes/page.tsx](file:///d:/Antigravity%20WS/ScholarLens/app/mistakes/page.tsx) - 错题本
- [components/RadarChart.tsx](file:///d:/Antigravity%20WS/ScholarLens/components/RadarChart.tsx) - 雷达图组件

---

---

### Week 2.5：UI/UX 优化与性能提升 (Iterative Improvements)

| 任务 | 说明 |
|------|------|
| 修复按钮悬停对比度 | 修正 `hover:bg-primary` 时文字不可见的问题 |
| 优化首屏加载性能 | 并行化 Supabase 查询，使用 React Suspense |
| 移动端手势优化 | 针对上传页和错题本增加更友好的触控反馈 |
| 视觉动效增强 | 引入更符合“黑科技”感的微动效 |

---

### Phase 3.6: AI 调优与数据基准 (AI Tuning)

| 任务 | 说明 |
|------|------|
| 基准库建设 | RAG 架构搭建：解析真题 -> 切片 -> 向量化 |
| 向量检索 | 使用 `text-embedding-004` (768维) 生成，Supabase pgvector 检索 |
| 难度校准 | 每次分析前检索 "Top 3 Most Similar Reference Questions" |
| Few-Shot | 将检索到的真题及难度作为 "Example" 注入 Prompt，强制 AI 对齐标准 |

#### [NEW] 新建文件
- [app/reference/page.tsx](file:///d:/Antigravity%20WS/ScholarLens/app/reference/page.tsx) - 基准库上传页
- [app/api/admin/upload-reference/route.ts](file:///d:/Antigravity%20WS/ScholarLens/app/api/admin/upload-reference/route.ts) - 真题解析与向量化 API
- [lib/ai/embedding.ts](file:///d:/Antigravity%20WS/ScholarLens/lib/ai/embedding.ts) - 向量生成工具

---

## 阶段 4：Week 3 - 变式题 + 优化

## 验证计划

### 自动化测试

由于这是新项目，暂无现有测试。建议：

| 测试类型 | 工具 | 覆盖范围 |
|----------|------|----------|
| 单元测试 | Vitest | AI Prompt 解析、数据转换 |
| E2E 测试 | Playwright | 登录流程、上传流程 |

具体测试命令将在项目初始化后确定。

### 手动验证

#### 阶段 1 验收（Week 1 结束）
1. 打开 `http://localhost:3000/auth/register`
2. 输入有效邀请码注册账号
3. 登录后跳转到首页
4. 进入上传页，选择图片，确认图片预览正常

#### 阶段 2 验收（Week 2 结束）
1. 上传一张数学试卷错题图片
2. 等待 AI 分析（应在 15 秒内返回）
3. 检查分析结果：知识点标签、错因分析、难度
4. 首页仪表盘显示雷达图
5. 错题本正确显示刚才上传的错题

#### 阶段 3 验收（Week 3 结束）
1. 选择一个薄弱知识点
2. 点击"生成变式题"
3. AI 生成类似但不同的题目
4. 完成答题，记录保存成功
5. 移动端浏览体验流畅

### 用户验收测试（UAT）
- 请您在 Week 1 结束后试用注册/上传流程
- 请您在 Week 2 结束后试用 AI 分析功能
- 最终交付前进行完整流程测试

---

## 风险与备选方案

| 风险 | 概率 | 备选方案 |
|------|------|----------|
| Gemini API 在中国不稳定 | 中 | 后端部署在海外节点，或换用其他 OCR |
| AI 识别准确率不足 | 中 | 添加用户手动编辑功能 |
| 3 周时间不够 | 低 | 优先完成 Week 1-2，Week 3 可延期 |

---

## 下一步

1. ✅ 您确认本计划

## Phase 5: UI Polish (Soft Professional / Linear Light) - Week 3

### 1. Global Theme Refine (Soft Professional)
- **Goal**: 从 "Apple" 转型为 "Notion/Linear Light" 风格 (柔和、专业、清晰)。
- **Key Changes**:
  - `globals.css`: 重定义 System Colors。
    - Background: `#FBFBFB` (Warm Off-White) 或 `#F4F4F5` (Zinc-100)
    - Surface: `#FFFFFF` (Pure White) + `border-zinc-200`
    - Text: `#18181B` (Zinc-900) 对比度优化
    - Accent: `#2563EB` (Royal Blue) 或 `#0F172A` (Slate-900)
  - Fonts: `Inter` (Sans) + `JetBrains Mono` (Data/Numbers).
  - Radius: 组件圆角统一调整为 `rounded-lg` 或 `rounded-xl` (专业感)。

### 2. Component Overhaul
- **Card**: 白底，细灰边框 (`border border-zinc-200`)，极轻微阴影 (`shadow-sm`)。
- **Button**: 高对比度文字按钮，或带有 subtle border 的 Ghost 按钮。
- **Input/Form**: 清晰的边框，Focus 时使用精确的 Ring。

### 3. Page-Specific Enhancements
- **Dashboard**:
  - 雷达图: 使用专业学术配色 (Teal/Indigo)。
  - 布局: 保持 Linear 的高密度信息结构，但使用 Light Mode。
- **Reference Library**:
  - 列表: 清晰的表格或网格试图，强调可读性。
- **Auth Pages**:
  - 极简、干净的登录/注册框，无多余装饰。

### 4. Responsiveness & Deployment
- **Mobile Adaptation**: 确保上传页、错题本在手机端的触摸体验 (Touch-friendly)。
- **Zeabur Deployment**: 配置 Dockerfile 或 Next.js preset，上线生产环境。
