/**
 * 一次性迁移脚本：将已有错题的 primary_knowledge_point 归一化到标准词表
 * 
 * 运行：node scripts/migrate_knowledge_points.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valParts] = line.split('=');
  if (key && valParts.length) env[key.trim()] = valParts.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 标准知识点词表（与 src/lib/knowledge_points.ts 保持同步）
const STANDARD_KP_NAMES = [
  "有理数及其运算", "实数与平方根", "整式与因式分解", "分式及其运算",
  "一元一次方程", "二元一次方程组", "一元二次方程", "分式方程",
  "一元一次不等式（组）", "一次函数与正比例函数", "反比例函数", "二次函数",
  "函数综合与应用",
  "线段、角与平行线", "三角形的基本性质", "全等三角形的判定与性质",
  "等腰三角形与等边三角形", "直角三角形与勾股定理", "相似三角形的判定与性质",
  "锐角三角函数与解直角三角形", "平行四边形的判定与性质", "矩形、菱形与正方形",
  "梯形", "圆的基本性质", "直线与圆的位置关系", "弧长与扇形面积",
  "轴对称与翻折", "旋转与中心对称", "平移与位似变换", "视图与投影",
  "几何最值问题",
  "数据的收集与整理", "统计图表", "平均数、中位数与众数", "方差与数据波动",
  "概率及其计算",
  "规律探索与数学归纳", "方程与不等式应用题", "函数建模与实际应用",
  "几何综合证明", "动点与动态几何", "坐标系与图形变换",
];

/**
 * 映射规则：旧名称 → 标准名称
 * 基于现有 17 条数据的实际 primary_knowledge_point 值
 */
const MIGRATION_MAP = {
  // 相似三角形系列 → 统一
  "相似三角形的判定与性质": "相似三角形的判定与性质",
  "相似三角形的性质": "相似三角形的判定与性质",
  "相似三角形的判定": "相似三角形的判定与性质",
  "相似三角形的面积比": "相似三角形的判定与性质",

  // 反比例函数系列 → 统一
  "反比例函数与几何图形综合": "反比例函数",
  "反比例函数与几何综合": "反比例函数",
  "反比例函数系数k的几何意义": "反比例函数",

  // 最值问题系列 → 统一
  "轴对称-最短路径问题": "几何最值问题",
  "几何最值问题（三点共线）": "几何最值问题",
  "几何-线段和差最值": "几何最值问题",

  // 位似变换
  "位似变换的坐标公式": "平移与位似变换",

  // 三角函数系列 → 统一
  "锐角三角函数与勾股定理的综合应用": "锐角三角函数与解直角三角形",
  "网格中的锐角三角函数": "锐角三角函数与解直角三角形",

  // 角平分线、射影 → 三角形性质
  "角平分线定理": "三角形的基本性质",
  "解直角三角形与射影定理": "锐角三角函数与解直角三角形",
};

async function migrate() {
  console.log("🚀 开始迁移 primary_knowledge_point...\n");

  const { data: mistakes, error } = await supabase
    .from('mistakes')
    .select('id, primary_knowledge_point')
    .is('deleted_at', null);

  if (error) {
    console.error("❌ 查询失败:", error.message);
    return;
  }

  console.log(`📊 共 ${mistakes.length} 条错题记录\n`);

  let updated = 0;
  let unchanged = 0;
  let unmapped = 0;

  for (const m of mistakes) {
    const oldKp = m.primary_knowledge_point;
    
    if (!oldKp) {
      console.log(`  ⚠️  ${m.id.slice(0,8)}: 无 primary_knowledge_point，跳过`);
      unmapped++;
      continue;
    }

    // 如果已经在标准词表中，不做修改
    if (STANDARD_KP_NAMES.includes(oldKp)) {
      console.log(`  ✅ ${m.id.slice(0,8)}: "${oldKp}" — 已标准化，跳过`);
      unchanged++;
      continue;
    }

    // 查找映射
    const newKp = MIGRATION_MAP[oldKp];
    if (!newKp) {
      console.log(`  ❓ ${m.id.slice(0,8)}: "${oldKp}" — 未找到映射，需手动处理`);
      unmapped++;
      continue;
    }

    // 执行更新
    const { error: updateError } = await supabase
      .from('mistakes')
      .update({ primary_knowledge_point: newKp })
      .eq('id', m.id);

    if (updateError) {
      console.error(`  ❌ ${m.id.slice(0,8)}: 更新失败 — ${updateError.message}`);
    } else {
      console.log(`  🔄 ${m.id.slice(0,8)}: "${oldKp}" → "${newKp}"`);
      updated++;
    }
  }

  console.log(`\n==========================================`);
  console.log(`✅ 已更新: ${updated}`);
  console.log(`⏭️  无需变更: ${unchanged}`);
  console.log(`❓ 未映射: ${unmapped}`);
  console.log(`==========================================`);
}

migrate();
