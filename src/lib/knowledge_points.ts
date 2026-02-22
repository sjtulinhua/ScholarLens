/**
 * 标准知识点词表（初中数学·中考版）
 * 基于《义务教育数学课程标准（2022年版）》及中考大纲整理
 * 
 * 用途：
 * 1. AI 分析错题后，通过 normalizeKnowledgePoint() 将自由文本映射到本词表
 * 2. Dashboard / 提分榜 / 知识详情页 统一使用标准名称进行分类展示
 * 3. question.knowledge_points（AI 原始标签）保持不动，提供详细信息
 * 
 * 维护规范：
 * - 每个条目的 name 是最终展示名  
 * - 新增条目时保持编号连续
 * - keywords 是用于模糊匹配 AI 自由返回值的关键词列表
 */

export type KnowledgePoint = {
  id: string;
  name: string;
  category: string;
  keywords: string[];  // 用于模糊匹配的关键词
};

// ============================================================
// 一、数与代数
// ============================================================
const ALGEBRA: KnowledgePoint[] = [
  { id: "A01", name: "有理数及其运算", category: "数与代数", keywords: ["有理数", "正数", "负数", "绝对值", "科学记数"] },
  { id: "A02", name: "实数与平方根", category: "数与代数", keywords: ["实数", "平方根", "立方根", "算术平方根", "无理数"] },
  { id: "A03", name: "整式与因式分解", category: "数与代数", keywords: ["整式", "因式分解", "多项式", "单项式", "完全平方"] },
  { id: "A04", name: "分式及其运算", category: "数与代数", keywords: ["分式运算", "分式化简"] },
  { id: "A05", name: "一元一次方程", category: "数与代数", keywords: ["一元一次方程"] },
  { id: "A06", name: "二元一次方程组", category: "数与代数", keywords: ["二元一次方程", "方程组", "消元"] },
  { id: "A07", name: "一元二次方程", category: "数与代数", keywords: ["一元二次方程", "韦达定理", "判别式", "根与系数"] },
  { id: "A08", name: "分式方程", category: "数与代数", keywords: ["分式方程", "增根"] },
  { id: "A09", name: "一元一次不等式（组）", category: "数与代数", keywords: ["不等式", "不等式组"] },
  { id: "A10", name: "一次函数与正比例函数", category: "数与代数", keywords: ["一次函数", "正比例函数", "一次函数图象"] },
  { id: "A11", name: "反比例函数", category: "数与代数", keywords: ["反比例函数", "反比例", "k的几何意义"] },
  { id: "A12", name: "二次函数", category: "数与代数", keywords: ["二次函数", "抛物线", "顶点", "对称轴"] },
  { id: "A13", name: "函数综合与应用", category: "数与代数", keywords: ["函数综合", "函数应用", "函数建模"] },
];

// ============================================================
// 二、图形与几何
// ============================================================
const GEOMETRY: KnowledgePoint[] = [
  { id: "B01", name: "线段、角与平行线", category: "图形与几何", keywords: ["线段", "平行线", "对顶角", "邻补角", "垂线"] },
  { id: "B02", name: "三角形的基本性质", category: "图形与几何", keywords: ["三角形性质", "内角和", "外角", "角平分线", "中线", "高"] },
  { id: "B03", name: "全等三角形的判定与性质", category: "图形与几何", keywords: ["全等三角形", "全等", "SSS", "SAS", "ASA", "AAS", "HL"] },
  { id: "B04", name: "等腰三角形与等边三角形", category: "图形与几何", keywords: ["等腰三角形", "等边三角形", "等腰"] },
  { id: "B05", name: "直角三角形与勾股定理", category: "图形与几何", keywords: ["勾股定理", "直角三角形", "勾股"] },
  { id: "B06", name: "相似三角形的判定与性质", category: "图形与几何", keywords: ["相似三角形", "相似", "相似比", "面积比"] },
  { id: "B07", name: "锐角三角函数与解直角三角形", category: "图形与几何", keywords: ["三角函数", "正弦", "余弦", "正切", "解直角三角形", "锐角三角函数", "射影定理"] },
  { id: "B08", name: "平行四边形的判定与性质", category: "图形与几何", keywords: ["平行四边形"] },
  { id: "B09", name: "矩形、菱形与正方形", category: "图形与几何", keywords: ["矩形", "菱形", "正方形"] },
  { id: "B10", name: "梯形", category: "图形与几何", keywords: ["梯形", "等腰梯形"] },
  { id: "B11", name: "圆的基本性质", category: "图形与几何", keywords: ["圆", "弦", "圆心角", "圆周角", "垂径定理"] },
  { id: "B12", name: "直线与圆的位置关系", category: "图形与几何", keywords: ["切线", "相切", "割线"] },
  { id: "B13", name: "弧长与扇形面积", category: "图形与几何", keywords: ["弧长", "扇形面积", "圆锥侧面积"] },
  { id: "B14", name: "轴对称与翻折", category: "图形与几何", keywords: ["轴对称", "翻折", "对称"] },
  { id: "B15", name: "旋转与中心对称", category: "图形与几何", keywords: ["旋转", "中心对称"] },
  { id: "B16", name: "平移与位似变换", category: "图形与几何", keywords: ["平移", "位似"] },
  { id: "B17", name: "视图与投影", category: "图形与几何", keywords: ["视图", "三视图", "投影", "展开图"] },
  { id: "B18", name: "几何最值问题", category: "图形与几何", keywords: ["最值", "最短路径", "最小值", "三点共线", "将军饮马"] },
];

// ============================================================
// 三、统计与概率
// ============================================================
const STATISTICS: KnowledgePoint[] = [
  { id: "C01", name: "数据的收集与整理", category: "统计与概率", keywords: ["数据收集", "普查", "抽样"] },
  { id: "C02", name: "统计图表", category: "统计与概率", keywords: ["统计图", "条形图", "折线图", "扇形图", "频数分布"] },
  { id: "C03", name: "平均数、中位数与众数", category: "统计与概率", keywords: ["平均数", "中位数", "众数", "加权平均"] },
  { id: "C04", name: "方差与数据波动", category: "统计与概率", keywords: ["方差", "标准差", "极差", "波动"] },
  { id: "C05", name: "概率及其计算", category: "统计与概率", keywords: ["概率", "树状图", "列表法", "随机事件"] },
];

// ============================================================
// 四、综合与应用
// ============================================================
const COMPREHENSIVE: KnowledgePoint[] = [
  { id: "D01", name: "规律探索与数学归纳", category: "综合与应用", keywords: ["规律探索", "归纳", "找规律"] },
  { id: "D02", name: "方程与不等式应用题", category: "综合与应用", keywords: ["应用题", "方程应用"] },
  { id: "D03", name: "函数建模与实际应用", category: "综合与应用", keywords: ["函数建模", "实际应用", "建模"] },
  { id: "D04", name: "几何综合证明", category: "综合与应用", keywords: ["几何综合", "综合证明", "几何证明"] },
  { id: "D05", name: "动点与动态几何", category: "综合与应用", keywords: ["动点", "动态几何", "运动"] },
  { id: "D06", name: "坐标系与图形变换", category: "综合与应用", keywords: ["坐标系", "图形变换", "平面直角坐标"] },
];

// ============================================================
// 导出
// ============================================================

/** 全部标准知识点（平铺数组） */
export const MATH_KNOWLEDGE_POINTS: KnowledgePoint[] = [
  ...ALGEBRA,
  ...GEOMETRY,
  ...STATISTICS,
  ...COMPREHENSIVE,
];

/** 按类目分组 */
export const MATH_KNOWLEDGE_POINTS_BY_CATEGORY = {
  "数与代数": ALGEBRA,
  "图形与几何": GEOMETRY,
  "统计与概率": STATISTICS,
  "综合与应用": COMPREHENSIVE,
} as const;

/** 知识点名称列表 */
export const MATH_KP_NAMES: string[] = MATH_KNOWLEDGE_POINTS.map(kp => kp.name);

/**
 * 本地归一化：将 AI 自由返回的知识点名称映射到标准词表
 * 
 * 匹配策略（优先级从高到低）：
 * 1. 精确匹配：AI 返回值与标准名完全一致
 * 2. 包含匹配：AI 返回值包含某标准名，或标准名包含 AI 返回值
 * 3. 关键词匹配：AI 返回值包含某条目的关键词（取匹配关键词数最多的）
 * 4. 无匹配：返回原值（不丢失数据）
 */
export function normalizeKnowledgePoint(rawKp: string): string {
  if (!rawKp) return rawKp;
  
  // 预处理：剥离常见前缀层级（如 "初中数学-几何-xxx" → "xxx"）
  const cleaned = rawKp.replace(/^(初中数学|中学数学|数学|几何|代数|统计)[—\-_·]*/g, '').trim() || rawKp;

  // 1. 精确匹配
  if (MATH_KP_NAMES.includes(cleaned)) return cleaned;
  if (MATH_KP_NAMES.includes(rawKp)) return rawKp;

  // 2. 包含匹配
  for (const kp of MATH_KNOWLEDGE_POINTS) {
    if (cleaned.includes(kp.name) || kp.name.includes(cleaned)) {
      return kp.name;
    }
  }

  // 3. 关键词匹配（计分制：匹配越多关键词得分越高）
  let bestMatch: KnowledgePoint | null = null;
  let bestScore = 0;

  for (const kp of MATH_KNOWLEDGE_POINTS) {
    let score = 0;
    for (const keyword of kp.keywords) {
      if (cleaned.includes(keyword) || rawKp.includes(keyword)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = kp;
    }
  }

  if (bestMatch && bestScore >= 1) {
    return bestMatch.name;
  }

  // 4. 无匹配 → 返回原值
  console.warn(`⚠️ 知识点未匹配到标准词表: "${rawKp}"`);
  return rawKp;
}
