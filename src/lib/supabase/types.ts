/**
 * 数据库类型定义
 * 与 Supabase 表结构对应
 */

// 科目枚举
export type Subject = "math" | "chinese" | "physics" | "chemistry" | "politics" | "history";

// 错误类型枚举
export type ErrorType = 
  | "calculation_error"      // 计算错误
  | "concept_confusion"      // 概念混淆
  | "reading_error"          // 审题不清
  | "method_error"           // 方法错误
  | "auxiliary_line_error"   // 辅助线错误
  | "template_missing"       // 答题模板缺失（文科）
  | "keyword_missing"        // 关键词遗漏（文科）
  | "other";                 // 其他

// 用户档案
export interface Profile {
  id: string;
  display_name: string | null;
  role: "student" | "parent" | "admin";
  created_at: string;
}

// 邀请码
export interface InvitationCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  created_at: string;
}

// 考试/试卷
export interface Exam {
  id: string;
  user_id: string;
  subject: Subject;
  title: string | null;
  image_url: string | null;
  created_at: string;
}

// 题目
export interface Question {
  id: string;
  exam_id: string | null;
  user_id: string;
  content: string;
  images: string[];
  subject: Subject;
  knowledge_points: string[];
  difficulty: number; // 1-5
  is_reference: boolean;
  meta_data: Record<string, unknown>;
  embedding: number[] | null;
  created_at: string;
}

// 错题记录
export interface Mistake {
  id: string;
  question_id: string;
  user_id: string;
  error_type: ErrorType;
  error_analysis: string | null;
  created_at: string;
}

// 练习记录
export interface PracticeRecord {
  id: string;
  user_id: string;
  question_id: string;
  variant_content: string;
  is_correct: boolean | null;
  created_at: string;
}

// Supabase 数据库类型（用于类型安全）
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      invitation_codes: {
        Row: InvitationCode;
        Insert: Omit<InvitationCode, "id" | "created_at">;
        Update: Partial<Omit<InvitationCode, "id" | "created_at">>;
      };
      exams: {
        Row: Exam;
        Insert: Omit<Exam, "id" | "created_at">;
        Update: Partial<Omit<Exam, "id" | "user_id" | "created_at">>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, "id" | "created_at">;
        Update: Partial<Omit<Question, "id" | "user_id" | "created_at">>;
      };
      mistakes: {
        Row: Mistake;
        Insert: Omit<Mistake, "id" | "created_at">;
        Update: Partial<Omit<Mistake, "id" | "user_id" | "created_at">>;
      };
      practice_records: {
        Row: PracticeRecord;
        Insert: Omit<PracticeRecord, "id" | "created_at">;
        Update: Partial<Omit<PracticeRecord, "id" | "user_id" | "created_at">>;
      };
    };
  };
}
