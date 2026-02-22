# ScholarLens Project Experience: Vector Dimension Evolution

## 📌 Context
In the RAG (Retrieval-Augmented Generation) system for ScholarLens, we use vector embeddings to deduplicate questions and retrieve reference materials. The synchronization between AI models, the `google-generative-ai` SDK, and the Supabase `pgvector` schema is critical for system stability.

## 🛠 Lessons Learned: Embedding Synchronization

### 1. Dimension Mismatch (The 3072 vs 1536 vs 768 Loop)
- **Issue**: We experienced multiple failures where the AI model returned dimensions (e.g., 768 or 1536) that didn't match the database column (`vector(3072)`).
- **Resolution**: We have decided to **standardize on 3072 dimensions**. 
- **Adaptive Padding**: To prevent future crashes if the model is changed, the `generateEmbedding` function now includes a **hard padding/slicing layer**. Any vector shorter than 3072 is zero-padded, and any longer is sliced. This guarantees database compatibility regardless of the AI model.

### 2. API Versioning 404s
- **Issue**: Calling `text-embedding-004` via the default `v1beta` endpoint occasionally returned 404 errors in specific environments.
- **Resolution**: Always specify the model with the `models/` prefix (e.g., `models/gemini-embedding-001`) and explicitly set `apiVersion: "v1"` in the configuration if 404s persist. Use `listModels` to verify availability in the current API key context.

### 3. Environment Specificity
- **Observation**: In the current deployment environment, `models/gemini-embedding-001` uniquely returns **3072 dimensions** (matching its ultra-high precision mode), which deviates from its standard 768-dimension behavior in other regions.
- **Strategy**: Always run a diagnostic script (`test-models.ts`) when deploying to a new environment to verify dimensionality before running migrations.

## 🚀 Final Architecture Strategy
> [!IMPORTANT]
> **Schema Stability**: All future embedding work must target **3072 dimensions**.
> **Model Index**: `models/gemini-embedding-001` is the current production standard due to its 3072-dimension performance in this environment.
> **Adaptive Safety**: The code-level padding logic must stay in place as a fail-safe mechanism.

## 🎨 UX & Layout Patterns
- **Bento Grid Workbench**: For multi-step processing (like cropping mistakes), use a central grid to display actionable results (crops) while keeping source materials in a sidebar. This reduces cognitive load and allows for easy review.
- **Partitioned Scrolling**: In complex multi-panel layouts, provide independent vertical scroll areas for the sidebar and main workbench. This prevents the entire page from shifting and keeps global actions (like headers) fixed.
- **Pick-Testing Interaction**: For complex canvas interactions (like croppers with zooming), use centralized coordinate-based pick-testing instead of DOM event bubble-up to ensure precision and prevent event conflicts.
- **Draft-State Rendering**: For high-frequency interactions (dragging/resizing), record changes in a local "draft" state and only commit to the global application state on interaction end (`mouseUp`). This ensures 60FPS feel in the UI.
- **Drag-and-Drop Ubiquity**: All upload-related containers (sidebars, workbenches, empty states) MUST support direct file drag-and-drop. Users expect all relevant UI areas to be active dropzones.

### 4. Local-First Migration (Supabase CLI + Docker)
- **Issue**: Deploying cloud Supabase in regions with high latency (e.g., China) makes the app frustratingly slow.
- **Resolution**: Migrated to a **Local-First** setup using Supabase CLI and Docker.
- **Vector Index Constraint**: Local `pgvector` has a **2000-dimension limit** for both `ivfflat` and `hnsw` indexes. Since we use `VECTOR(3072)`, we cannot create an ANN index locally.
- **Strategy**: Drop the vector index in local migrations. For single-user local usage, a sequential scan on 3072-dim vectors is still extremely fast (< 10ms) and avoids build errors.

### 5. Backend Optimization & Throughput
- **Issue**: Per-question sequential embedding and DB insertion caused 70s+ timeouts for exams.
- **Resolution**: Implemented **Batch Embedding** (processing 5 questions in parallel) and **Bulk DB Insertion**.
- **Result**: Reference exam upload time dropped from 70s to ~10s.

### 6. Subject System Decoupling
- **Evolution**: Expanded from 3 hardcoded subjects to 7, then to 9 (Math, Chinese, English, Physics, Chemistry, History, Politics, Geography, Biology).
- **Pattern**: Centralized all subject logic into `src/lib/subjects.ts` (single source of truth).
- **DB Strategy**: Removed hardcoded `CHECK` constraints on the database. Added subjects no longer require SQL migrations or DB resets.
- **UI Architecture**: For high-density headers (many tabs + control buttons), a **two-row layout** is superior to horizontal scrolling. Row 1: Subject Tabs (flex-wrap). Row 2: Secondary Controls (Filters, Batch Management) aligned right.

### 7. AI Session Handoff Strategy
- **Context Management**: As sessions grow long, Token usage spikes and AI "forgetfulness" increases.
- **Protocol**: Mandate a "Knowledge Sync" before session end. Store structured handoffs in `.agent/knowledge/session_handoff.md` and update long-term `.agent/*.md` files. This ensures a "Cold Start" in a new session is faster and more accurate than a "Bloated Long Session".

### 8. PowerShell Command Constraints (AI Agent Pitfall)
- **Issue**: Most AI agents default to using `&&` to chain commands (e.g., `git add . && git commit`). In the local **Windows PowerShell** environment used for this project, `&&` is not a valid statement separator and causes a `ParserError`.
- **Resolution**: ALWAYS use `;` instead of `&&` when chaining multiple commands in a single `run_command` call, or simply split them into separate tool calls.
- **Example**: Use `git add -A; git commit -m "..."` instead of `git add -A && git commit ...`.

### 9. Git Commit Strategy (AI Agent Behavior)
- **Rule**: DO NOT proactively create `git commit`s after minor feature changes or bug fixes.
- **Reasoning**: Frequent autonomous commits interrupt the workflow flow for the user and clutter the local history. 
- **Action**: Only stage/commit files when the user explicitly requests it (e.g., "please commit this").

### 10. 归因考点原则（Primary Knowledge Point Attribution）
- **核心原则**: 学生错题的知识点分类**只以 `primary_knowledge_point` 字段（归因考点）为准**。
- **数据来源**: `primary_knowledge_point` 由 AI 在分析错题时判定，代表"这道题做错的根本原因所考察的知识点"。它存储在 `mistakes` 表上，不在 `questions` 表。
- **与 `questions.knowledge_points` 的区别**: `knowledge_points` 是题目涉及的所有知识点标签列表（由 AI 返回），是泛化的；`primary_knowledge_point` 是归因后的单一焦点。
- **使用规范**:
  - Dashboard 聚合、错题列表过滤、知识详情页计数 — **全部用 `primary_knowledge_point` 原始值**。
  - **禁止**对 `primary_knowledge_point` 做 `split(/[-_]/).pop()` 或任何前缀剥离操作。该字段本身就是最终分类名。
  - 前缀剥离逻辑仅适用于处理 `questions.knowledge_points` 中的层级化标签（如 `"初中数学-几何-三角形"`），不可跨字段复用。
- **历史教训**: 两次因混淆 `knowledge_points` 和 `primary_knowledge_point` 的统计逻辑导致页面间数据不一致。此原则不可违反。

### 11. 知识点标准化策略（Local Normalization Pattern）
- **适用场景**: 每新增一个科目时都需要执行此流程。
- **流程**：
  1. **搜索官方考纲**：去中国教育部或省级教育考试院网站，获取该科目的中考/高考知识点大纲（如《义务教育数学课程标准2022版》）。
  2. **建立标准词表**：在 `src/lib/knowledge_points.ts` 中新增该科目的标准知识点数组，每个条目包含 `id`、`name`、`category`、`keywords`（模糊匹配关键词）。
  3. **本地归一化**：通过 `normalizeKnowledgePoint()` 函数在 AI 返回后、入库前进行本地匹配。**禁止将词表注入 AI prompt**——这会浪费 500+ tokens/次，长期成本极高。
  4. **保留 AI 原始标签**：`question.knowledge_points`（AI 自由返回的细粒度标签）保留原值不做修改，可为学生提供更多细节信息。仅 `mistakes.primary_knowledge_point` 被标准化。
  5. **历史迁移**：新增词表后，写一次性脚本（参考 `scripts/migrate_knowledge_points.mjs`）批量更新已有记录。
- **匹配优先级**：精确匹配 > 包含匹配 > 关键词计分匹配 > 返回原值。
- **核心原则**：AI 自由发挥 + 本地约束 = 零额外 token 成本 + 标准化输出。

---
*Last Updated: 2026-02-22*
