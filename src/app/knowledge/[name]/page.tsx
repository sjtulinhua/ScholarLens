import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, BookOpen, Lightbulb, Target } from "lucide-react";
import Link from "next/link";
import { analyzeKnowledgePoint } from "./actions";
import { LatexRenderer } from "@/components/ui/latex-renderer";

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const supabase = await createClient();

  // 1. 获取该知识点下的错题统计 (需与 Dashboard 逻辑一致：仅统计以此为“归因考点”的错题)
  const { data: { user } } = await supabase.auth.getUser();
  const { data: mistakes } = await supabase
    .from("mistakes")
    .select("primary_knowledge_point, questions!inner(knowledge_points)")
    .eq("user_id", user?.id)
    .is("deleted_at", null);

  const count = mistakes?.filter((m: any) => {
    const pkp = m.primary_knowledge_point;
    return pkp === name;
  }).length || 0;

  // 2. Fetch AI-generated definition (cached or on-the-fly)
  const analysis = await analyzeKnowledgePoint(name);

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      <header className="flex items-center gap-4">
        <Link href="/mistakes">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-mono mt-1">
            Knowledge Base / 知识详解
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-white border-zinc-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              核心概念 / Basic Concept
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 prose prose-zinc max-w-none">
            <LatexRenderer content={analysis.definition} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white text-zinc-800 border-zinc-200/60 shadow-xl shadow-zinc-200/40">
            <CardContent className="pt-6">
              <div className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest">User Statistics</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{count || 0}</span>
                <span className="text-xs text-zinc-500 font-sans">个报错记录</span>
              </div>
              <div className="mt-4 h-1 bg-zinc-800 rounded-full">
                <div className="h-full bg-orange-500 w-[60%] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200 shadow-sm">
             <CardHeader className="py-3">
               <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                 <Target className="w-3 h-3" />
                 中考考点 / Exam Focus
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3 pb-6">
               {(analysis?.tips || []).map((tip: string, i: number) => (
                 <div key={i} className="flex gap-3 text-sm text-zinc-600">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                   <p>{tip}</p>
                 </div>
               ))}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
