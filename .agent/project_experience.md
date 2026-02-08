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

---
*Created on 2026-02-07 to prevent further regression. Migrated to .agent on 2026-02-08.*
