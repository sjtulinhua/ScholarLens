import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Filter, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

/**
 * 错题本页面
 */
export default async function MistakesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 获取所有错题 (联合查找问题详情)
  const { data: mistakes } = await supabase
    .from("mistakes")
    .select(`
      id,
      status,
      created_at,
      question:questions (*)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">我的错题本</h1>
        </div>
        <Button variant="outline" size="sm" className="rounded-full">
          <Filter className="mr-2 h-4 w-4" /> 筛选对比
        </Button>
      </header>

      {mistakes && mistakes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mistakes.map((m: any) => (
            <Card key={m.id} className="group overflow-hidden border-primary/5 hover:border-primary/20 transition-all duration-500 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="relative aspect-[16/10] bg-black/40 overflow-hidden">
                {m.question.images?.[0] ? (
                  <Image 
                    src={m.question.images[0]} 
                    alt="题目图片" 
                    fill 
                    className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic text-xs">
                    无预览图
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-primary/90 backdrop-blur-md text-[10px] px-2.5 py-1 rounded-full text-primary-foreground font-black uppercase tracking-tighter border border-white/10 shadow-lg">
                    {m.question.subject}
                  </span>
                  {m.status === "corrected" && (
                    <span className="bg-green-500/90 backdrop-blur-md text-[10px] px-2.5 py-1 rounded-full text-white font-black shadow-lg">
                      DONE
                    </span>
                  )}
                </div>
              </div>
              <CardHeader className="pb-2 space-y-1">
                <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                  {m.question.knowledge_points?.[0] || "整理中..."}
                </CardTitle>
                <div className="flex gap-1.5 flex-wrap">
                  {m.question.knowledge_points?.slice(1).map((kp: string) => (
                    <span key={kp} className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-primary/5">
                      {kp}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic border-l-2 border-primary/30 pl-4 py-1">
                  {m.question.error_analysis || "AI 正在生成深度诊断报告..."}
                </p>
                <div className="flex items-center justify-between border-t border-primary/5 pt-4">
                  <span className="text-[11px] font-medium text-muted-foreground/60">
                    {new Date(m.created_at).toLocaleDateString()} 收录
                  </span>
                  <Button size="sm" variant="ghost" className="rounded-full h-9 px-5 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                    细节回顾 <BookOpen className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="pt-3 border-t border-primary/5">
                   <Link href={`/practice?id=${m.question.id}`} className="block">
                    <Button variant="default" size="sm" className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
                      <span className="mr-2">⚡</span> 生成变式题挑战
                    </Button>
                   </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      ) : (
        <Card className="p-12 border-dashed border-2 bg-transparent flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-full bg-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">错题本还是空的</h2>
            <p className="text-muted-foreground max-w-sm">
              上传你的第一张试卷图片，AI 将会自动为您分类并收录到这里。
            </p>
          </div>
          <Link href="/upload">
            <Button size="lg" className="rounded-full">去上传错题</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
