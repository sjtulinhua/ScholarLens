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

---
*Last Updated: 2026-02-22*
