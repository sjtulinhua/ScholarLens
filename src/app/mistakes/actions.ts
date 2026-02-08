'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 软删除错题记录 (移入垃圾箱)
 * @param mistakeId mistakes 表的 ID
 */
export async function deleteMistake(mistakeId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mistakes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', mistakeId)

  if (error) {
    console.error('Soft delete mistake error:', error)
    throw new Error('移入垃圾箱失败')
  }

  revalidatePath('/mistakes')
  revalidatePath('/mistakes/trash')
  revalidatePath('/')
  return { success: true }
}

/**
 * 还原错题记录
 * @param mistakeId mistakes 表的 ID
 */
export async function restoreMistake(mistakeId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mistakes')
    .update({ deleted_at: null })
    .eq('id', mistakeId)

  if (error) {
    console.error('Restore mistake error:', error)
    throw new Error('还原失败')
  }

  revalidatePath('/mistakes')
  revalidatePath('/mistakes/trash')
  return { success: true }
}

/**
 * 永久删除错题记录
 * @param mistakeId mistakes 表的 ID
 */
export async function permanentDeleteMistake(mistakeId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mistakes')
    .delete()
    .eq('id', mistakeId)

  if (error) {
    console.error('Permanent delete mistake error:', error)
    throw new Error('永久删除失败')
  }

  revalidatePath('/mistakes/trash')
  return { success: true }
}

/**
 * 更新错题日期 (修改的是关联的 question 的 occurred_at)
 * @param questionId questions 表的 ID
 * @param newDate 新日期 (ISOString or YYYY-MM-DD)
 */
export async function updateMistakeDate(questionId: string, newDate: string) {
  const supabase = await createClient()
  
  const isoDate = new Date(newDate).toISOString()

  const { error } = await supabase
    .from('questions')
    .update({ occurred_at: isoDate })
    .eq('id', questionId)

  if (error) {
    console.error('Update mistake date error:', error)
    throw new Error('修改日期失败')
  }

  revalidatePath('/mistakes')
  revalidatePath('/')
  return { success: true }
}

/**
 * 批量软删除错题记录
 * @param mistakeIds mistakes 表的 ID 数组
 */
export async function bulkDeleteMistakes(mistakeIds: string[]) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mistakes')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', mistakeIds)

  if (error) {
    console.error('Bulk soft delete mistakes error:', error)
    throw new Error('批量移入垃圾箱失败')
  }

  revalidatePath('/mistakes')
  revalidatePath('/mistakes/trash')
  revalidatePath('/')
  return { success: true }
}

/**
 * 批量还原错题记录
 * @param mistakeIds mistakes 表的 ID 数组
 */
export async function bulkRestoreMistakes(mistakeIds: string[]) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mistakes')
    .update({ deleted_at: null })
    .in('id', mistakeIds)

  if (error) {
    console.error('Bulk restore mistakes error:', error)
    throw new Error('批量还原失败')
  }

  revalidatePath('/mistakes')
  revalidatePath('/mistakes/trash')
  return { success: true }
}

/**
 * 批量永久删除错题记录
 * @param mistakeIds mistakes 表的 ID 数组
 */
export async function bulkPermanentDeleteMistakes(mistakeIds: string[]) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('mistakes')
    .delete()
    .in('id', mistakeIds)

  if (error) {
    console.error('Bulk permanent delete mistakes error:', error)
    throw new Error('批量永久删除失败')
  }

  revalidatePath('/mistakes/trash')
  return { success: true }
}
