# ScholarLens Project Instructions for AI Agents

> 🛑 **CRITICAL READ ME FIRST**: Any AI agent working on this project MUST read and follow these rules to prevent regression.

## 1. Core Architecture: Vector Dimensions
**Rule**: The vector dimension for embeddings is strictly **3072**.
- **Database**: `VECTOR(3072)` in Supabase (`questions.embedding`).
- **Code**: `src/lib/ai/embedding.ts` acts as an adapter. It MUST handle `padding` (if model returns < 3072) or `truncation` (if > 3072).
- **Reason**: We experienced instability with Google's changing embedding models (001 vs 004). 3072 is our "Super-Set" standard. **DO NOT CHANGE THIS TO 768 or 1536.**

## 2. Tech Stack Constraints
- **Framework**: Next.js 15 (App Router).
- **Database**: Supabase (PostgreSQL + pgvector).
- **AI Model**: Google Gemini 3.0 Pro (`gemini-3-pro-preview` or `gemini-2.0-pro-exp-02-05`).
- **Styling**: Tailwind CSS + Shadcn UI.

## 3. Workflow Standards
- **Migrations**: Do not create scattered migration files. Update `supabase/MASTER_SCHEMA.sql` as the single source of truth for schema changes.
- **Smart Upload**: The upload flow is "One Image -> Auto-Crop -> N Mistakes". Do not revert to manual-only cropping.

## 4. Environment Variables
- `GOOGLE_GEMINI_API_KEY`: Required.
- `NEXT_PUBLIC_SUPABASE_URL`: Required.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Required.
- `MOCK_AI`: Set to 'true' to skip API calls during UI dev.

---
*Last Updated: 2026-02-08*
