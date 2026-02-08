
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCw, Trash2, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { TrashMistakeList } from "@/components/mistakes/TrashMistakeList";

export default async function TrashPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/login");
  }

  // Query soft-deleted mistakes
  const { data: mistakes, error } = await supabase
    .from("mistakes")
    .select(`
      id,
      status,
      created_at,
      deleted_at,
      question:questions!inner (*) 
    `)
    .not("deleted_at", "is", null) // Filter for deleted items
    .order("deleted_at", { ascending: false });
  
  if (error) {
    console.error("Fetch trash mistakes error:", error);
    return <div className="p-8 text-center text-red-500">获取垃圾箱内容失败: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mistakes">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="space-y-1">
             <h1 className="text-3xl font-bold tracking-tight text-red-900/80">垃圾箱</h1>
             <p className="text-xs text-muted-foreground">已删除的错题会保留在此处，直到您选择“彻底删除”</p>
          </div>
        </div>
      </header>

      {mistakes && mistakes.length > 0 ? (
        <TrashMistakeList mistakes={mistakes} />
      ) : (
        <Card className="p-12 border-dashed border-2 bg-transparent flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-full bg-muted">
            <Trash2 className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">垃圾箱是空的</h2>
            <p className="text-muted-foreground max-w-sm">
              您删除的错题会出现在这里。
            </p>
          </div>
          <Link href="/mistakes">
            <Button size="lg" className="rounded-full" variant="outline">返回错题本</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
