# ScholarLens

厦门中考冲刺系统 - 智能错题分析与个性化练习

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 填入实际的 API 密钥
```

### 3. 设置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 进入 SQL Editor，依次执行：
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage_setup.sql`
3. 从项目设置复制 URL 和 API Keys 到 `.env.local`

### 4. 安装 Shadcn/ui 组件（可选）

```bash
# 安装常用组件
npx shadcn@latest add button input card
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
scholarlens/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 首页
│   │   └── globals.css      # 全局样式
│   ├── components/          # React 组件
│   └── lib/
│       ├── supabase/        # Supabase 客户端
│       │   ├── client.ts    # 浏览器端
│       │   ├── server.ts    # 服务端
│       │   └── types.ts     # 类型定义
│       └── utils.ts         # 工具函数
├── supabase/
│   └── migrations/          # SQL 迁移脚本
├── docs/                    # 项目文档
└── ...
```

## 技术栈

- **框架**: Next.js 15 (App Router) + TypeScript
- **样式**: Tailwind CSS + Shadcn/ui
- **数据库**: Supabase (PostgreSQL + pgvector)
- **认证**: Supabase Auth + RLS
- **AI**: Google Gemini + DeepSeek
