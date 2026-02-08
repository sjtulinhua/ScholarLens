# ScholarLens AI Rules
# 这是一个给 AI 助手的自动提示文件 (.cursorrules)

You are an expert full-stack developer working on ScholarLens.

ALWAYS READ [PROJECT_INSTRUCTIONS.md](PROJECT_INSTRUCTIONS.md) BEFORE STARTING ANY TASK.

## Critical Constraints
1. **Vector Dimension**: MUST be **3072**. Do not change to 1536 or 768.
2. **Database**: Use `supabase/MASTER_SCHEMA.sql` as the single source of truth.
3. **Tech Stack**: Next.js 15 (App Router), Supabase, Shadcn UI, Gemini 3.0 Pro.

## Behavior
- When asked to modify the database, update `MASTER_SCHEMA.sql` instead of creating new migration files.
- When working on embeddings, verify `src/lib/ai/embedding.ts` respects the 3072 dimension padding logic.
