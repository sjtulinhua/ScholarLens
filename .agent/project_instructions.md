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
   - **Primary**: Local-First via Docker (Zero latency).
   - **Optional**: Supabase Cloud (For shared dev/prod).

- **Migrations**: 
   - **Local**: Automatically applied from `supabase/migrations/` on start. 
   - **Cloud**: Must be manually executed in Supabase SQL Editor.
- **Master Schema**: `supabase/MASTER_SCHEMA.sql` is the source of truth.
- **Smart Upload**: The upload flow is "One Image -> Auto-Crop -> N Mistakes".

## 4. Environment Variables
- `GOOGLE_GEMINI_API_KEY`: Required.
- `NEXT_PUBLIC_SUPABASE_URL`: `http://127.0.0.1:54321` (Local-First).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Locally generated key ($ npx supabase status).
- `MOCK_AI`: Set to 'true' to skip API calls during UI dev.

---
*Last Updated: 2026-02-08*
