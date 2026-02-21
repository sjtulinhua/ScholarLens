# ScholarLens

厦门中考冲刺系统 - 智能错题分析与个性化练习

## 🚀 环境搭建

本项目支持两种运行模式，推荐使用 **本地优先 (Local-First)** 模式以获得最佳响应速度。

---

### 方案 A：本地开发 (推荐)

最快的开发和使用体验，数据与图片均保存在本地。

**前置要求**: 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)

1. **配置环境**:
   ```bash
   npm install
   cp .env.example .env.local
   # 填入 AI 秘钥 (Gemini/DeepSeek)，Supabase 秘钥留空或保持默认
   ```

2. **启动本地服务**:
   ```bash
   # 启动本地 Supabase 容器 (含数据库、Auth、向量服务)
   npm run supabase:start
   ```

3. **运行应用**:
   ```bash
   npm run dev
   ```

> [!NOTE]
> **本地自动化**: 在本地模式下，数据库表结构会自动通过 `supabase/migrations` 同步，**无需手动执行 SQL**。

---

### 方案 B：云端部署 (可选)

适合需要公网访问或多人协作的场景。

1. **设置远程数据库**:
   - 在 [Supabase Cloud](https://supabase.com) 创建新项目。
   - 获取 `URL` 和 `anon_key` 并填入 `.env.local`。

2. **初始化表结构**:
   - 访问 Supabase 控制台的 **SQL Editor**。
   - 依次执行 `supabase/migrations/` 文件夹下的所有 `.sql` 文件以创建表、策略和存储桶。

3. **运行/部署**:
   - 本地运行: `npm run dev`
   - 部署到 Vercel/Zeabur: 参考对应平台的部署指南。

---

## 💾 数据存储说明

| 类型 | 本地模式 | 云端模式 |
| :--- | :--- | :--- |
| **数据库** | 本地 Docker 容器 | Supabase Cloud 远程库 |
| **错题图片** | `public/exam-images/` | Supabase Cloud Storage |
| **迁移性** | 极高 (直接拷贝文件夹) | 需通过网络同步 |

---

---

## 🚚 迁移指南 (更换电脑)

如果您需要换一台电脑开发/使用，请按以下步骤操作，确保数据（包括错题、AI 分析结果、向量数据）完整迁移：

### 第一步：备份数据 (旧电脑)
在项目根目录运行以下命令，将所有错题记录和向量数据导出为 SQL 文件：
```bash
# 导出所有数据内容到 data.sql
npx supabase db dump --data-only > data.sql
```
> [!IMPORTANT]
> 同时请确保拷贝 `public/exam-images/` 文件夹，这里存着您的错题图片。

### 第二步：环境恢复 (新电脑)
1.  把项目文件夹（含 `data.sql` 和 `public/exam-images/`）拷贝到新电脑。
2.  依照 [本地环境启动步骤](#1-启动本地环境-local-first) 执行 `npm install` 和 `npx supabase start`。
3.  **导入数据**：
    ```bash
    # 将备份的数据导入到新电脑的本地数据库
    npx supabase db reset --data-only --file data.sql
    ```
    *或者直接使用 psql 导入:*
    ```bash
    npx supabase psql -f data.sql
    ```

### 第三步：验证
启动应用 `npm run dev`，您会发现所有的错题回复、AI 笔记以及**语义搜索功能（向量数据）**都已完美恢复。

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
