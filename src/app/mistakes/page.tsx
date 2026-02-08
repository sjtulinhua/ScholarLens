import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Filter, BookOpen } from "lucide-react";
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

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    console.log("No user found in MistakesPage, redirecting to login");
    redirect("/login");
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

  const { data: mistakes, error } = await query;
  
  if (error) {
    console.error("Fetch mistakes error:", error);
    return <div className="p-8 text-center text-red-500">获取错题失败: {error.message}</div>;
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
          <MistakesFilter />
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
