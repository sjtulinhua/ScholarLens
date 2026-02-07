import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./auth/actions";
import { WeaknessRadar, type WeaknessData } from "@/components/dashboard/WeaknessRadar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, History, BrainCircuit, BookOpen, FileWarning, Database } from "lucide-react";
import { HistoryDialog } from "@/components/dashboard/HistoryDialog";

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

  // 1. 并发获取数据提升性能
  const [mistakesResult, recentQuestionsResult] = await Promise.all([
    supabase
      .from("mistakes")
      .select(`
        id,
        status,
        question:questions (
          subject,
          knowledge_points
        )
      `)
      .limit(100),
    supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  const mistakes = mistakesResult.data;
  const recentQuestions = recentQuestionsResult.data;

  // 2. 加工雷达图数据
  const kpMap: Record<string, { total: number; corrected: number }> = {};
  mistakes?.forEach((m: any) => {
    if (m.question) {
      m.question.knowledge_points.forEach((kp: string) => {
        if (!kpMap[kp]) kpMap[kp] = { total: 0, corrected: 0 };
        kpMap[kp].total += 1;
        if (m.status === "corrected") kpMap[kp].corrected += 1;
      });
    }
  });

  const radarData: WeaknessData[] = Object.entries(kpMap)
    .map(([name, stats]) => ({
      name: name.split("-")[1] || name,
      mastery: stats.total > 0 ? (stats.corrected / stats.total) * 100 + 40 : 0,
      total: stats.total
    }))
    .slice(0, 6);

  // 计算总掌握率
  const totalCorrected = mistakes?.filter(m => m.status === "corrected").length || 0;
  const totalMistakes = mistakes?.length || 0;
  const overallMastery = totalMistakes > 0 ? Math.round((totalCorrected / totalMistakes) * 100) : 0;

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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-4">
        
        {/* Left Column: Data Vis (Tablet: left col, Desktop: 8 cols) */}
        <div className="md:col-span-1 lg:col-span-8 flex flex-col gap-6 lg:gap-8 order-2 md:order-1 lg:order-1">
          <Card className="flex-1 min-h-[400px] md:min-h-[500px] bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden group hover:border-zinc-300 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-100 bg-zinc-50/50">
              <CardTitle className="flex items-center text-sm font-semibold text-zinc-600 uppercase tracking-widest font-mono">
                <BrainCircuit className="mr-2 h-4 w-4 text-zinc-400" />
                知识谱系 / Knowledge Graph
              </CardTitle>
              <div className="text-[10px] text-zinc-400 font-mono border border-zinc-200 bg-white px-2 py-0.5 rounded uppercase">
                Realtime
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pt-6">
              <div className="w-full h-full p-2 md:p-4">
                <WeaknessRadar data={radarData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Key Stats & Quick Actions (Tablet: right col, Desktop: 4 cols) */}
        <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-6 order-1 md:order-2 lg:order-2">
          
          {/* Key Metric: Big Statement */}
          <Card className="bg-white border border-zinc-200 shadow-sm rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group min-h-[220px] hover:border-zinc-300 transition-all">
             <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none"></div>
             <div>
                <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest font-medium">Active Tasks</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-6xl font-bold tracking-tighter text-zinc-900">
                    {mistakes?.filter(m => m.status === "active").length || 0}
                  </span>
                  <span className="text-sm text-zinc-400 font-normal font-sans leading-none pb-1">Items Pending</span>
                </div>
             </div>
             <div className="mt-8 space-y-3">
                <div className="flex justify-between items-end border-b border-dashed border-zinc-200 pb-2">
                  <div className="text-[10px] text-zinc-400 font-mono uppercase">Mastery Level</div>
                  <div className="text-lg font-bold font-mono tracking-tight text-zinc-900">{overallMastery}%</div>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-zinc-900 rounded-full transition-all duration-1000" 
                    style={{ width: `${overallMastery}%` }} 
                   />
                </div>
             </div>
          </Card>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/mistakes" className="group">
              <div className="aspect-square bg-white border border-zinc-200 hover:border-orange-200 hover:bg-orange-50 shadow-sm rounded-xl flex flex-col items-center justify-center text-center p-4 transition-all duration-200 group-hover:shadow-md cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileWarning className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
                </div>
                <div className="text-sm font-semibold text-zinc-800">错题本</div>
                <div className="text-[10px] text-zinc-400 mt-1 font-mono uppercase tracking-widest">Mistakes</div>
              </div>
            </Link>
            <Link href="/reference" className="group">
              <div className="aspect-square bg-white border border-zinc-200 hover:border-blue-200 hover:bg-blue-50 shadow-sm rounded-xl flex flex-col items-center justify-center text-center p-4 transition-all duration-200 group-hover:shadow-md cursor-pointer">
                 <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                </div>
                <div className="text-sm font-semibold text-zinc-800">基准库</div>
                <div className="text-[10px] text-zinc-400 mt-1 font-mono uppercase tracking-widest">Base DB</div>
              </div>
            </Link>
          </div>

          <HistoryDialog recentQuestions={recentQuestions} />

          {/* Placeholder/Coming Soon */}
          <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-5 text-center group cursor-not-allowed hover:bg-zinc-100 transition-colors">
             <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
               Future Update
             </div>
             <div className="text-xs text-zinc-500 mt-1 font-medium">智能考纲预测即将上线</div>
          </div>
        </div>
      </div>
    </div>
  );
}
