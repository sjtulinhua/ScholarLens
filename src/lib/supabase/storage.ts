import { createClient } from "./server"

/**
 * 上传图片到 Supabase Storage
 */
export async function uploadExamImage(file: File | Buffer, fileName: string, mimeType: string) {
  const supabase = await createClient()

  // 1. 获取当前用户 ID 用于存储路径 (RLS 策略隔离)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("未登录或 Session 已失效")

  const path = `${user.id}/${Date.now()}_${fileName}`

  // 2. 上传数据
  const { data, error } = await supabase.storage
    .from("exam-images")
    .upload(path, file, {
      contentType: mimeType,
      upsert: false
    })

  if (error) {
    console.error("Storage Upload Error:", error)
    throw new Error(`上传失败: ${error.message}`)
  }

  // 3. 获取公共 URL (虽然 bucket 是私有的，但我们可以通过 getPublicUrl 配合 RLS 或临时 URL)
  // 这里推荐使用 getPublicUrl，并在 RLS 中允许本人查看
  const { data: urlData } = supabase.storage
    .from("exam-images")
    .getPublicUrl(path)

  return {
    path,
    url: urlData.publicUrl
  }
}
