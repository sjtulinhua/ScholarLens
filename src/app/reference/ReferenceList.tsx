import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ReferenceListView } from "./ReferenceListView";

export async function ReferenceList() {
  const isLocalFirst = process.env.NEXT_PUBLIC_LOCAL_FIRST === 'true';
  const supabase = isLocalFirst ? createAdminClient() : await createClient();
  
  let references: any[] = [];
  let userMistakes: { difficulty: number }[] = [];

  try {
    // 查询已收录的基准题目
    const { data: refs, error } = await supabase
      .from("questions")
      .select("id, content, official_year, subject, difficulty, created_at, answer, analysis, images, knowledge_points")
      .eq("is_reference", true)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("ReferenceList query error:", error);
    } else if (refs) {
      references = refs;
    }

    // 获取当前用户的错题难度分布 (仅统计有效的错题)
    // We safely handle this in case the network is down or user is not logged in
    const authResult = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const user = authResult?.data?.user;
    
    if (user) {
      const { data: mistakesData } = await supabase
        .from("mistakes")
        .select(`
          status,
          question:questions (difficulty)
        `)
        .eq("user_id", user.id)
        .limit(500);
        
      if (mistakesData) {
        userMistakes = mistakesData
          .filter(m => m.status !== 'archived' && m.question)
          .map(m => ({ difficulty: (m.question as any).difficulty }));
      }
    }
  } catch (err) {
    console.error("ReferenceList unexpected error:", err);
    // If entirely offline, we fall back to empty arrays so the UI empty state triggers smoothly.
  }

  // 将数据传递给客户端组件进行复杂交互
  return <ReferenceListView initialItems={references} userMistakes={userMistakes} />;
}
