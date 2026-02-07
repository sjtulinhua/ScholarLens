# Project: ScholarLens (MVP)

## 1. Vision & Scope
构建一个针对中国厦门中考体系的学生错题分析系统。
- 阶段: MVP (优先实现数学，预留全科接口).
- 部署: Zeabur (Cloud PaaS). 后端直连 Google/DeepSeek API，无需代理。
- 用户: 私密分享模式 (需邀请码注册，支持多用户隔离).

## 2. Tech Stack (Strict Constraints)
- Framework: Next.js 15 (App Router) + TypeScript.
- Styling: Tailwind CSS + Shadcn/ui (Dark Tech aesthetic, Mobile-First).
- Database: Supabase (PostgreSQL + pgvector).
- Auth: Supabase Auth (Email/Password) + RLS (Row Level Security).
- AI Logic (Model Router):
  - Vision/Math/Science: Google Gemini 1.5 Pro or Gemini 3 Pro.
  - Humanities (History/Politics): DeepSeek V3 (via OpenAI client).

## 3. Core Features
1.  Secure Auth: Register requires a valid `invitation_code`. Users can only see their own data (RLS).
2.  Smart Upload: Upload exam image -> AI OCR -> Split Questions -> Auto-tag Difficulty (L1-L5) & Knowledge Point (Xiamen Std).
3.  Adaptive Calibration (RAG): Before grading, retrieve 3 similar "Reference Questions" from DB to ensure consistent difficulty rating.
4.  Dashboard: Radar chart showing weakness by knowledge point.

## 4. Database Schema Rules
- `profiles`: id (FK to auth.users), role.
- `invitation_codes`: code, is_used.
- `exams`: id, user_id, subject (enum), image_url.
- `questions`: id, exam_id, content (markdown), difficulty, tags (jsonb), is_reference (bool), embedding (vector).
- `mistakes`: id, question_id, student_id, reason.

## 5. Development Style
- Use `zod` for validation.
- Use Next.js Server Actions for all DB/API interactions.
- Comments: Important logic must have Chinese comments.