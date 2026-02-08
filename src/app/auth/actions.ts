'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 验证 Schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6位'),
})

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6位'),
  invitationCode: z.string().min(1, '请输入邀请码'),
  displayName: z.string().min(1, '请输入昵称'),
})

export type AuthState = {
  error?: string
  success?: boolean
}

/**
 * 登录 Action
 */
export async function login(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const data = Object.fromEntries(formData)
  
  // 1. 数据验证
  const parsed = loginSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  // 2. Supabase 登录
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    return { error: '登录失败：账号或密码错误' }
  }

  // 3. 登录成功
  revalidatePath('/', 'layout')
  // 不要在 Server Action 中做 redirect，这在某些环境下会导致 Cookie 设置失败
  // 改为返回 success 状态，让客户端处理跳转
  return { success: true }
}

/**
 * 注册 Action
 */
export async function register(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const data = Object.fromEntries(formData)

  // 1. 数据验证
  const parsed = registerSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password, invitationCode, displayName } = parsed.data
  const supabase = await createClient()

  // 2. 验证邀请码 (需要使用 admin 权限查询，因为 RLS 限制)
  // 这里我们用一种巧妙的方法：invitation_codes 表的 RLS 允许 public 读取 (已在 policies 中设置)
  // 但为了安全，也可以通过 RPC 或 Admin Client。
  // 暂时直接查询，因为我们在 002_rls_policies.sql 中设置了 "Anyone can check invitation codes"
  
  const { data: codeData, error: codeError } = await supabase
    .from('invitation_codes')
    .select('id, is_used')
    .eq('code', invitationCode)
    .single()

  if (codeError || !codeData) {
    return { error: '无效的邀请码' }
  }

  if (codeData.is_used) {
    return { error: '该邀请码已被使用' }
  }

  // 3. 注册用户
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (authError) {
    console.error('Register error:', authError)
    return { error: `注册失败: ${authError.message}` }
  }

  if (!authData.user) {
    return { error: '注册失败：无法创建用户' }
  }

  // 4. 标记邀请码为已使用
  // 注意：普通用户注册后可能还没权限更新 invitation_codes 表 (取决于 RLS)
  // 我们在 002_rls_policies.sql 设置了 "Authenticated users can use invitation codes"
  // 用户注册成功并登录后，才算 Authenticated。
  // 所以这里可能也会有权限问题，最好的方式是用 Admin Client 处理这一步。
  
  // 动态导入 Admin Client 避免并在客户端组件中打包
  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminClient = createAdminClient()
  
  const { error: updateError } = await adminClient
    .from('invitation_codes')
    .update({ 
      is_used: true,
      used_by: authData.user.id 
    })
    .eq('id', codeData.id)

  if (updateError) {
    console.error('Error updating invitation code:', updateError)
    // 注册已成功，但更新邀请码失败。这属于边缘情况，暂不阻断流程，记录日志即可。
  }

  // 5. 跳转
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * 退出登录 Action
 */
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
