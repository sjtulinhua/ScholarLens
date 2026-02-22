'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * 将基准库中的任意题目一键加入当前用户的错题本
 */
export async function addReferenceToMistakes(questionId: string) {
  try {
    const isLocalFirst = process.env.NEXT_PUBLIC_LOCAL_FIRST === 'true'
    const supabase = isLocalFirst ? createAdminClient() : await createClient()

    let userId: string

    if (isLocalFirst) {
      // 本地免登模式使用默认用户
      userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID!
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: '请先登录' }
      }
      userId = user.id
    }

    // 1. 检查该错题是否已经在用户的错题本里
    const { data: existing, error: checkError } = await supabase
      .from('mistakes')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single()

    if (existing) {
      return { error: '该题目已经在您的错题本中了' }
    }

    // 2. 插入新的一条 mistake 记录关联到该 question_id
    const { error: insertError } = await supabase
      .from('mistakes')
      .insert({
        user_id: userId,
        question_id: questionId,
        status: 'active'
      })

    if (insertError) {
      console.error('Insert mistake error:', insertError)
      return { error: '加入错题本失败，请稍后重试' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('addReferenceToMistakes exception:', err)
    return { error: err.message || '系统异常' }
  }
}

export async function deleteReferenceSource(sourceName: string) {
  try {
    const isLocalFirst = process.env.NEXT_PUBLIC_LOCAL_FIRST === 'true'
    const supabase = isLocalFirst ? createAdminClient() : await createClient()

    let query = supabase.from('questions').delete().eq('is_reference', true)
    
    // 如果来源名是 "未分类来源" 或者为空，说明原题里 official_year 为 null 或空
    if (!sourceName || sourceName === "未分类来源") {
      query = query.is('official_year', null)
    } else {
      query = query.eq('official_year', sourceName)
    }

    const { error } = await query

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('deleteReferenceSource error:', err)
    return { error: err.message || '删除试卷失败' }
  }
}

export async function deleteReferenceSources(sourceNames: string[]) {
  if (!sourceNames || sourceNames.length === 0) return { success: true }
  
  try {
    const isLocalFirst = process.env.NEXT_PUBLIC_LOCAL_FIRST === 'true'
    const supabase = isLocalFirst ? createAdminClient() : await createClient()

    // 区分处理普通的 official_year 和特殊的 "未分类来源"
    const validNames = sourceNames.filter(name => name !== "未分类来源")
    const hasUncategorized = sourceNames.includes("未分类来源")

    let query = supabase.from('questions').delete().eq('is_reference', true)

    if (hasUncategorized && validNames.length > 0) {
      // 既有普通分类，又有未分类
      query = query.or(`official_year.in.(${validNames.join(',')}),official_year.is.null`)
    } else if (hasUncategorized) {
      // 只有未分类
      query = query.is('official_year', null)
    } else if (validNames.length > 0) {
      // 只有普通分类
      query = query.in('official_year', validNames)
    } else {
      return { success: true }
    }

    const { error } = await query

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('deleteReferenceSources error:', err)
    return { error: err.message || '批量删除试卷失败' }
  }
}
