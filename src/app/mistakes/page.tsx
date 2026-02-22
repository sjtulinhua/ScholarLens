import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Filter, BookOpen, Trash2, Trash } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LatexRenderer } from "@/components/ui/latex-renderer";

import { MistakesFilter } from "@/components/mistakes/MistakesFilter";
import { MistakeList } from "@/components/mistakes/MistakeList";

/**
 * 错题本页面
 */
export default async function MistakesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams; // Next.js 15 Requirement: await searchParams
  const subject = typeof params.subject === 'string' ? params.subject : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const knowledgePoint = typeof params.knowledge_point === 'string' ? params.knowledge_point : undefined;

  const isLocalFirst = process.env.NEXT_PUBLIC_LOCAL_FIRST === 'true';
  const supabase = isLocalFirst ? createAdminClient() : await createClient();
  
  if (isLocalFirst) {
    // Local-First 模式下使用默认用户
    var user = { id: process.env.NEXT_PUBLIC_DEFAULT_USER_ID! } as any;
  } else {
    const { data } = await supabase.auth.getUser();
    var user = data?.user as any;
  
    if (!user) {
      console.log("No user found in MistakesPage, redirecting to login");
      redirect("/login");
    }
  }

  // 构建查询
  let query = supabase
    .from("mistakes")
    .select(`
      id,
      status,
      created_at,
      question:questions!inner (*) 
    `)
    .order("created_at", { ascending: false });

  // 1. 状态过滤 (直接在 mistakes 表)
  if (status) {
    query = query.eq("status", status);
  }

  // 2. 科目过滤 (在关联的 questions 表)
  // !inner join 允许我们根据关联表的字段进行过滤
  if (subject) {
    query = query.eq("question.subject", subject);
  }

  // 知识点过滤（改为在下方内存中过滤，因为需要支持剥离子分类前缀的匹配）
  // if (knowledgePoint) ...

  const { count: trashCount } = await supabase
    .from("mistakes")
    .select("id", { count: "exact", head: true })
    .not("deleted_at", "is", null);

  let { data: mistakes, error } = await query;
  
  if (error) {
    console.error("Fetch mistakes error:", error);
    return <div className="p-8 text-center text-red-500">获取错题失败: {error.message}</div>;
  }

  // 3. 知识点近义词/后缀过滤 (在内存中进行，以支持 "代数-反比例函数" = "反比例函数")
  if (knowledgePoint && mistakes) {
    mistakes = mistakes.filter((m: any) => {
      const q = Array.isArray(m.question) ? m.question[0] : m.question;
      const kps = q?.knowledge_points;
      if (!Array.isArray(kps)) return false;
      
      return kps.some((kp: any) => {
        const cleanKp = typeof kp === 'string' ? (kp.split(/[-_]/).pop()?.trim() || kp) : '';
        return cleanKp === knowledgePoint;
      });
    });
  }

  console.log(`Fetched ${mistakes?.length || 0} mistakes for user ${user.id}`);

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
        <Suspense fallback={<Button variant="outline" size="sm" className="rounded-full opacity-50">Loading...</Button>}>
          <div className="flex items-center gap-2">
            <MistakesFilter />
            <Link href="/mistakes/trash">
               <Button 
                variant={(trashCount || 0) > 0 ? "secondary" : "ghost"} 
                size="sm" 
                className={(trashCount || 0) > 0 ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-muted-foreground hover:text-zinc-900"}
               >
                  <div className="relative">
                    {(trashCount || 0) > 0 ? (
                        <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            <span className="absolute -top-1 -right-0 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        </>
                    ) : (
                        <Trash className="w-4 h-4 mr-1" />
                    )}
                  </div>
                  垃圾箱
                  {(trashCount || 0) > 0 && <span className="ml-1 text-xs">({trashCount})</span>}
               </Button>
            </Link>
          </div>
        </Suspense>
      </header>

      {mistakes && mistakes.length > 0 ? (
        <MistakeList mistakes={mistakes} />
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
