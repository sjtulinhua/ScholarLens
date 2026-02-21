import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createClient } from './server'

/**
 * 将图片保存到本地文件系统 (public/exam-images)
 * 这样图片就直接随项目代码移动，实现真正的本地化
 */
export async function uploadExamImage(file: File | Buffer, fileName: string, mimeType: string) {
  const supabase = await createClient()

  // 1. 验证用户 (保持 RLS 逻辑的一致性，虽然是本地，但我们依然关联用户)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("未登录或 Session 已失效")

  // 2. 准备目录
  const publicDir = join(process.cwd(), 'public')
  const uploadDir = join(publicDir, 'exam-images', user.id)
  
  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (e) {
    // 目录可能已存在
  }

  // 3. 准备文件名和路径
  const safeName = `${Date.now()}_${fileName.replace(/[^a-z0-9.]/gi, '_')}`
  const filePath = join(uploadDir, safeName)
  const relativePath = `exam-images/${user.id}/${safeName}`

  // 4. 写入文件
  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(await (file as File).arrayBuffer())
  await writeFile(filePath, buffer)

  // 5. 返回相对于 public 的 URL
  return {
    path: relativePath,
    url: `/${relativePath}` // Next.js 会自动将 public 下的文件映射到根路径
  }
}
