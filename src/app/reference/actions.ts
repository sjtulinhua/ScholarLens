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
