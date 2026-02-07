import { createClient } from "@/lib/supabase/server";
import { ReferenceListView } from "./ReferenceListView";

export async function ReferenceList() {
  const supabase = await createClient();
  
  // 查询已收录的基准题目
  // 我们增加到 200 条，基本涵盖一次大规模录入。再多的话可以考虑分页。
  const { data: references } = await supabase
    .from("questions")
    .select("id, content, official_year, subject, difficulty, created_at")
    .eq("is_reference", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!references || references.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        <p>暂无基准数据</p>
        <p className="text-xs mt-1 opacity-70">上传几份试卷吧，它们会按年份自动归档。</p>
      </div>
    );
  }

  // 将数据传递给客户端组件进行复杂交互
  return <ReferenceListView initialItems={references} />;
}
