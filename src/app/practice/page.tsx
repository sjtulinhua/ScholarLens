"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { createVariant } from "./actions";
import { VariantResult } from "@/lib/ai/variant";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import Link from "next/link";
import { formatKnowledgePoint } from "@/lib/format";

export default function PracticePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const questionId = searchParams.get("id");
  const [originalQuestion, setOriginalQuestion] = useState<any>(null);
  const [variantData, setVariantData] = useState<VariantResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  // 1. 加载原题
  useEffect(() => {
    async function loadData() {
      if (!questionId) return;
      
      const supabase = createClient();
      const { data } = await supabase
        .from("questions")
        .select("*")
        .eq("id", questionId)
        .single();
        
      if (data) setOriginalQuestion(data);
      setLoading(false);
    }
    loadData();
  }, [questionId]);

  // 2. 生成变式题
  const handleGenerate = async () => {
    if (!questionId) return;
    setGenerating(true);
    setVariantData(null);
    setShowSolution(false);

    try {
      const result = await createVariant(questionId);
      if (result.success && result.recordId) {
        // 重新获取刚才生成的记录（因为 actions 里我们把 JSON 存进去了）
        const supabase = createClient();
        const { data } = await supabase
          .from("practice_records")
          .select("variant_content")
          .eq("id", result.recordId)
          .single();
          
        if (data?.variant_content) {
          try {
            const parsed = JSON.parse(data.variant_content);
            setVariantData(parsed);
          } catch (e) {
            // fallback: 也许是纯文本
            console.error("JSON parse failed", e);
          }
        }
      } else {
        alert(result.error || "生成失败");
      }
    } catch (e) {
      console.error(e);
      alert("网络错误");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!originalQuestion) {
    return <div className="p-8 text-center text-muted-foreground">未找到题目 ID</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">强化练习</h1>
          <p className="text-muted-foreground">针对性攻克薄弱考点</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          返回
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 左侧：原题回顾 */}
        <Card className="md:h-[calc(100vh-200px)] overflow-y-auto border-muted/50">
          <CardHeader className="bg-muted/20 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground">原题</span>
              知识点回顾
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {Array.isArray(originalQuestion.knowledge_points) && 
                originalQuestion.knowledge_points.map((k: string, i: number) => {
                  const shortKp = formatKnowledgePoint(k);
                  return (
                    <Link 
                      key={i} 
                      href={`/knowledge/${encodeURIComponent(k)}`}
                      className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      {shortKp}
                    </Link>
                  );
                })
              }
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {originalQuestion.images && originalQuestion.images[0] && (
               /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={originalQuestion.images[0]} 
                alt="Original" 
                className="w-full rounded-lg border mb-4"
              />
            )}
            <LatexRenderer content={originalQuestion.content} />
            
            <div className="mt-8 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2 text-red-500/80">你的错因：</h4>
              <div className="text-sm text-muted-foreground">
                <LatexRenderer content={originalQuestion.error_analysis} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：变式训练 */}
        <div className="space-y-6">
          {!variantData ? (
             <Card className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 border-dashed">
               <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                 <RefreshCw className={`w-8 h-8 text-primary ${generating ? "animate-spin" : ""}`} />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-semibold">准备好了吗？</h3>
                 <p className="text-muted-foreground max-w-xs mx-auto">
                   AI 将为你生成一道与左侧题目**考点相同、解法类似但数值不同**的变式题。
                 </p>
               </div>
               <Button size="lg" onClick={handleGenerate} disabled={generating}>
                 {generating ? "正在出题中..." : "生成变式题 Challenge"}
               </Button>
             </Card>
          ) : (
            <Card className="border-primary shadow-lg overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  变式挑战
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border border-primary/10">
                  <LatexRenderer content={variantData.variant_content} />
                </div>

                <div className="pt-4 space-y-4">
                  {!showSolution ? (
                    <Button className="w-full" size="lg" onClick={() => setShowSolution(true)}>
                      查看解析与答案
                    </Button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="p-4 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg border border-green-500/20 text-sm">
                        <strong>答案解析：</strong>
                        <div className="mt-2 text-foreground/80">
                          <LatexRenderer content={variantData.solution} />
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full" onClick={handleGenerate}>
                        再练一题
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// 临时 icon 组件
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
