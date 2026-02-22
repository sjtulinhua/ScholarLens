import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ReferenceListView } from "./ReferenceListView";

export async function ReferenceList() {
  const isLocalFirst = process.env.NEXT_PUBLIC_LOCAL_FIRST === 'true';
  const supabase = isLocalFirst ? createAdminClient() : await createClient();
  
  // 查询已收录的基准题目
  // 我们增加到 200 条，基本涵盖一次大规模录入。再多的话可以考虑分页。
  const { data: references, error } = await supabase
    .from("questions")
    .select("id, content, official_year, subject, difficulty, created_at, answer, analysis, images, knowledge_points")
    .eq("is_reference", true)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("ReferenceList query error:", error);
  }

  // 获取当前用户的错题难度分布 (仅统计有效的错题)
  let userMistakes: { difficulty: number }[] = [];
  const { data: { user } } = await supabase.auth.getUser();
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

  if (!references || references.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        <p>暂无基准数据</p>
        <p className="text-xs mt-1 opacity-70">上传几份试卷吧，它们会按年份自动归档。</p>
      </div>
    );
  }

  // 将数据传递给客户端组件进行复杂交互
  return <ReferenceListView initialItems={references} userMistakes={userMistakes} />;
}
