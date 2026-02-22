'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * 获取指定 ID 的错题详情（用于打印预览）
 * 包含题目内容、错因、解析、知识点等完整信息
 */
export async function getReviewQuestions(questionIds: string[]) {
  const supabase = await createClient()

  // 查询所有选中的 questions，关联 mistakes 获取错因信息
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      content,
      images,
      subject,
      knowledge_points,
      error_type,
      analysis,
      error_analysis,
      answer,
      meta_data,
      difficulty,
      occurred_at
    `)
    .in('id', questionIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getReviewQuestions error:', error)
    return { error: error.message }
  }

  return { data: questions || [] }
}

/**
 * 智能推荐：按错误频次排序，推荐 Top N 高频错题
 * 逻辑：统计每个 knowledge_point 出现在 mistakes 中的次数，
 * 优先推荐那些关联知识点出现频率最高的、且尚未"掌握"的错题
 */
export async function getSmartRecommendations(limit: number = 10) {
  const supabase = await createClient()

  // 获取所有未删除的 mistakes，按创建时间倒序
  // 通过 question 关联获取知识点信息
  const { data: mistakes, error } = await supabase
    .from('mistakes')
    .select(`
      id,
      status,
      question:questions!inner (
        id,
        knowledge_points,
        subject,
        content
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getSmartRecommendations error:', error)
    return { error: error.message }
  }

  if (!mistakes || mistakes.length === 0) {
    return { data: [] }
  }

  // 统计每个 question_id 出现的错误次数（通过 mistakes 关联）
  // 同时统计知识点的全局错误频次
  const questionFrequency: Record<string, { count: number; questionId: string }> = {}
  const kpFrequency: Record<string, number> = {}

  for (const m of mistakes) {
    const q = m.question as any
    if (!q?.id) continue

    // 统计题目出现次数
    if (!questionFrequency[q.id]) {
      questionFrequency[q.id] = { count: 0, questionId: q.id }
    }
    questionFrequency[q.id].count++

    // 统计知识点频次
    if (Array.isArray(q.knowledge_points)) {
      for (const kp of q.knowledge_points) {
        kpFrequency[String(kp)] = (kpFrequency[String(kp)] || 0) + 1
      }
    }
  }

  // 对每个题目计算综合权重：自身错误次数 + 关联知识点总频次
  const scoredQuestions = Object.values(questionFrequency).map(({ count, questionId }) => {
    const q = mistakes.find(m => (m.question as any)?.id === questionId)?.question as any
    let kpScore = 0
    if (q && Array.isArray(q.knowledge_points)) {
      kpScore = q.knowledge_points.reduce((sum: number, kp: string) => sum + (kpFrequency[String(kp)] || 0), 0)
    }
    return {
      questionId,
      score: count * 2 + kpScore, // 主权重: 错误次数 x2 + 知识点热度
    }
  })

  // 按综合分数降序排序，取 Top N
  scoredQuestions.sort((a, b) => b.score - a.score)
  const topIds = scoredQuestions.slice(0, limit).map(q => q.questionId)

  return { data: topIds }
}

/**
 * 获取某题目已有的变式练习记录
 */
export async function getExistingVariant(questionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('practice_records')
    .select('id, variant_content')
    .eq('question_id', questionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getExistingVariant error:', error)
    return { data: null }
  }

  if (data?.variant_content) {
    try {
      const parsed = JSON.parse(data.variant_content)
      return { data: parsed }
    } catch {
      return { data: null }
    }
  }

  return { data: null }
}

/**
 * Server Action wrapper 保证 generateVariant 运行在服务端，从而能访问 API Key
 */
import { generateVariant } from '@/lib/ai/variant'

export async function generateVariantAction(content: string, knowledgePoints: string[]) {
  try {
    const result = await generateVariant(content, knowledgePoints)
    return { data: result }
  } catch (error: any) {
    console.error('generateVariantAction error:', error)
    return { error: error.message || '变式题生成失败' }
  }
}

