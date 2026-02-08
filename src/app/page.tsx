import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./auth/actions";
import { Plus, BrainCircuit } from "lucide-react";
import { Suspense } from "react";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

/**
 * ScholarLens 首页 - 仪表盘
 */
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 space-y-8 bg-[#F5F5F7]">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-600 font-medium text-sm mb-4 shadow-sm">
            厦门中考冲刺专属
          </div>
          <h1 className="text-6xl font-semibold tracking-tight text-[#1D1D1F]">
            ScholarLens
          </h1>
          <p className="text-xl text-neutral-500 font-light leading-relaxed">
            智能错题分析系统 · 让每一次错误都成为进步的基石
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base bg-white border-neutral-200 hover:bg-neutral-50">登录账号</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="lg" className="rounded-full px-8 h-12 text-base bg-[#0071E3] hover:bg-[#0077ED] shadow-lg shadow-blue-500/30">注册新账号</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-zinc-900 p-6 lg:p-12 space-y-10 max-w-7xl mx-auto font-sans selection:bg-zinc-200">
      {/* Header - Minimal & Professional */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 border-b border-zinc-200/60 font-sans tracking-tight gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
             <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white shrink-0">
                <BrainCircuit className="w-5 h-5" />
             </div>
             控制台
          </h1>
          <p className="text-zinc-500 mt-2 text-xs font-mono tracking-widest uppercase pl-11">
            SYS.OVERVIEW / {user.email?.split("@")[0]}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto pl-11 md:pl-0">
          <Link href="/upload" className="flex-1 md:flex-none">
            <Button className="w-full md:w-auto rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm border border-zinc-900 transition-all font-medium px-5 h-10 text-sm">
              <Plus className="mr-2 h-4 w-4" /> 分析题目
            </Button>
          </Link>
          <form action={logout}>
            <Button variant="outline" className="text-zinc-500 hover:text-zinc-900 border-zinc-200 hover:bg-white hover:border-zinc-300 transition-all bg-white shadow-sm h-10 rounded-lg">
              登出
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content Grid - Streaming with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardMetrics />
      </Suspense>
    </div>
  );
}
