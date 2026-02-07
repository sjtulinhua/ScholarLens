"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadReferenceFile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "未登录" };
  }

  const file = formData.get("file") as File;
  const description = formData.get("description") as string;

  if (!file) {
    return { error: "未检测到文件" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: "文件大小不能超过 10MB" };
  }

  // 1. 上传到 Supabase Storage (reference-docs bucket)
  // 注意：需要先去 Supabase 创建这个 bucket，或者复用 exam-images 但分目录
  // 这里假设我们复用 exam-images 但放在 references 目录下
  const path = `reference/${user.id}/${Date.now()}_${file.name}`;
  
  const { error: uploadError } = await supabase.storage
    .from("exam-images") // 临时复用
    .upload(path, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { error: "文件上传失败" };
  }

  // 2. 存入数据库记录 (TODO: 需要新建 reference_docs 表，或者先打 log)
  // MVP 阶段暂时只存文件，后续配合 Vector DB 实现 RAG
  // 这里即使没有表，上传成功也是第一步

  // 模拟成功
  return { success: true };
}
