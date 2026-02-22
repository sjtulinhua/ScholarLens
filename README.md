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

### 方案 B：云端部署 (Supabase Cloud)

适合需要公网访问或分发给他人使用的场景。

1. **获取项目 ID**:
   - 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建或选择项目。
   - 在项目设置的 URL 中找到项目 ID (例如 `https://supabase.com/dashboard/project/abc-xyz` 中的 `abc-xyz`)。

2. **建立连接 (初次使用)**:
   ```bash
   npx supabase login
   # 绑定本地目录到远程项目
   npx supabase link --project-ref <您的项目-ID>
   ```

3. **同步数据库结构**:
   ```bash
   # 将本地 supabase/migrations 下的脚本推送到云端
   npx supabase db push
   ```

4. **初始化数据 (可选)**:
   ```bash
   # 如果需要同步本地的 seed.sql 数据到云端
   npx supabase db reset --linked
   ```

> [!TIP]
> 同步完成后，记得更新 `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 为云端地址。
---

## 💾 数据存储说明

| 类型 | 本地模式 | 云端模式 |
| :--- | :--- | :--- |
| **数据库** | 本地 Docker 容器 | Supabase Cloud 远程库 |
| **错题图片** | `public/exam-images/` | Supabase Cloud Storage |
| **迁移性** | 极高 (直接拷贝文件夹) | 需通过网络同步 |

---

## 🚚 迁移指南 (更换电脑)

如果您需要换一台电脑开发/使用，请按以下步骤操作，确保数据（包括错题、AI 分析结果、向量数据）完整迁移：

### 第一步：备份数据 (旧电脑)
在项目根目录运行以下命令，将所有错题记录和向量数据导出为 SQL 文件：
```bash
# 导出所有数据内容到 seed.sql
npx supabase db dump --data-only > seed.sql
```
> [!IMPORTANT]
> 同时请确保拷贝 `public/exam-images/` 文件夹，这里存着您的错题图片。

### 第二步：环境恢复 (新电脑)
1.  把项目文件夹（含 `seed.sql` 和 `public/exam-images/`）拷贝到新电脑。
2.  依照 [方案 A](#方案-a本地开发-推荐) 步骤执行 `npm install` 和 `npm run supabase:start`。
3.  **导入数据**：
    ```bash
    # 将备份的数据导入到新电脑的本地数据库
    npx supabase db reset --data-only --file seed.sql
    ```

### 第三步：验证
启动应用 `npm run dev`，您会发现所有的错题回复、AI 笔记以及**语义搜索功能（向量数据）**都已完美恢复。

## 项目结构

```
scholarlens/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   ├── components/          # React 组件
│   └── lib/
│       └── supabase/        # Supabase 客户端与类型
├── supabase/
│   ├── migrations/          # SQL 迁移脚本 (Master Schema)
│   └── seed.sql             # 初始/备份数据
├── public/
│   └── exam-images/         # 本地图片存储
└── docs/                    # 项目文档
```

## 技术栈

- **框架**: Next.js 15 (App Router) + TypeScript
- **样式**: Tailwind CSS + Shadcn/ui
- **数据库**: Supabase (PostgreSQL + pgvector)
- **AI**: Google Gemini + DeepSeek

---

## 🔄 AI 会话交接指南

Antigravity **没有**压缩或清空对话的功能。当对话过长时，需要新建会话。使用以下提示词实现无缝交接：

### 结束旧会话（保存知识）

在当前会话即将结束前，发送：

```
我准备结束本次会话。请按以下顺序执行操作：
1. **更新长期文档**：将本次会话中的“踩坑经验”追加到 `.agent/project_experience.md`，将“新的开发约定”同步到 `.agent/project_instructions.md`。
2. **同步进度**：在 `.agent/task.md` 中标记已完成事项，并在 Backlog 中添加新发现的任务。
3. **编写交接简报**：将当前的状态和待办整理到 `.agent/knowledge/session_handoff.md`。

简报包含：
- 本次会话的功能与改动摘要
- 待执行的下一个具体原子任务
- 关键文件路径索引
```

### 启动新会话（加载知识）

在新会话的第一条消息中发送：

```
我正在接手 ScholarLens 项目的开发。请先阅读以下文件来获取项目上下文：

【必读 - 项目规则与经验】
1. .agent/rules.md — AI 行为规则（向量维度、技术栈约束）
2. .agent/project_instructions.md — 架构规则、环境变量、UI 约定
3. .agent/project_experience.md — 踩坑经验和 UX 模式总结

【必读 - 项目状态】
4. .agent/task.md — 全局开发进度和 Backlog
5. .agent/handoff.md — 上次交接文档

【必读 - 代码约定】
6. src/lib/subjects.ts — 全局科目定义（唯一定义源）
7. README.md — 项目概览和技术栈

阅读完成后，告诉我你对项目现状的理解，以及当前的待办事项。
```

> [!TIP]
> Antigravity 的 Knowledge Items (KI) 系统会自动保存跨会话的关键知识，
> 但项目特定的架构约定建议手动存到 `.agent/knowledge/` 目录下以确保完整性。
