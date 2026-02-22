/**
 * 全局科目定义
 * 所有需要科目列表的地方统一从此引用，避免分散硬编码
 */

export const ALL_SUBJECTS = [
  { value: "math",      label: "数学" },
  { value: "chinese",   label: "语文" },
  { value: "english",   label: "英语" },
  { value: "physics",   label: "物理" },
  { value: "chemistry", label: "化学" },
  { value: "history",   label: "历史" },
  { value: "politics",  label: "政治" },
  { value: "geography", label: "地理" },
  { value: "biology",   label: "生物" },
] as const;

/** 用于快速查找 value → label 的映射 */
export const SUBJECT_LABEL_MAP: Record<string, string> = Object.fromEntries(
  ALL_SUBJECTS.map(s => [s.value, s.label])
);

/** 全部科目 + "全部" 选项（用于筛选器/Tabs 等需要 "all" 选项的场景） */
export const ALL_SUBJECTS_WITH_ALL = [
  { value: "all", label: "全部" },
  ...ALL_SUBJECTS,
] as const;
