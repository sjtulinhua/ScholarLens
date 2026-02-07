# ScholarLens 项目设置指南

## ✅ 已完成的工作

### 1. 项目结构
- ✅ Next.js 15 + TypeScript + Tailwind CSS
- ✅ Supabase 客户端配置（浏览器端 + 服务端）
- ✅ TypeScript 类型定义
- ✅ Shadcn/ui 配置
- ✅ 环境变量模板

### 2. 数据库迁移脚本
- ✅ `001_initial_schema.sql` - 6张表 + pgvector + 索引
- ✅ `002_rls_policies.sql` - 完整的行级安全策略
- ✅ `003_storage_setup.sql` - 图片存储配置

---

## 📋 您需要做的事情

### 步骤 1: 安装依赖

```bash
cd "d:\Antigravity WS\ScholarLens"
npm install
```

这将安装所有必需的包，包括：
- Next.js 15
- React 19
- Supabase 客户端
- Tailwind CSS
- Shadcn/ui 依赖
- Zod（数据验证）

### 步骤 2: 配置环境变量

1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local`，填入以下密钥：

#### Supabase 配置
1. 访问 https://supabase.com
2. 创建新项目（或使用现有项目）
3. 进入 **Project Settings** → **API**
4. 复制以下值到 `.env.local`：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

#### AI API 配置
1. **Google Gemini**（用于数学/理科）
   - 访问 https://aistudio.google.com/apikey
   - 创建 API Key
   - 填入 `GOOGLE_GEMINI_API_KEY`

2. **DeepSeek**（用于语文）
   - 访问 https://platform.deepseek.com/
   - 创建 API Key
   - 填入 `DEEPSEEK_API_KEY`

### 步骤 3: 设置 Supabase 数据库

1. 进入 Supabase 项目的 **SQL Editor**
2. 依次执行以下 3 个脚本：

```sql
-- 第一步：创建表结构
-- 复制 supabase/migrations/001_initial_schema.sql 的内容并执行

-- 第二步：设置 RLS 策略
-- 复制 supabase/migrations/002_rls_policies.sql 的内容并执行

-- 第三步：配置存储桶
-- 复制 supabase/migrations/003_storage_setup.sql 的内容并执行
```

### 步骤 4: 验证设置

运行开发服务器：
```bash
npm run dev
```

访问 http://localhost:3000，应该看到 "ScholarLens" 首页。

---

## 🔍 验证清单

- [ ] `npm install` 成功完成
- [ ] `.env.local` 已创建并填写所有密钥
- [ ] Supabase 数据库中有 6 张表：
  - profiles
  - invitation_codes
  - exams
  - questions
  - mistakes
  - practice_records
- [ ] Supabase Storage 中有 `exam-images` bucket
- [ ] `npm run dev` 成功启动
- [ ] 浏览器访问 http://localhost:3000 正常显示

---

## ⚠️ 常见问题

### Q: npm install 报错？
A: 确保使用 Node.js 18+ 版本：`node -v`

### Q: Supabase 连接失败？
A: 检查 `.env.local` 中的 URL 和 Key 是否正确复制（注意末尾不要有空格）

### Q: pgvector 扩展安装失败？
A: Supabase 项目默认已启用 pgvector，如果报错可以忽略 `CREATE EXTENSION IF NOT EXISTS vector;` 这一行

---

## 📌 下一步

完成上述步骤后，我们将开始开发：
1. 认证页面（登录 + 邀请码注册）
2. 上传页面（拍照 + 图片预览）
3. Week 1 验收测试
