"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Maximize2, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { LatexRenderer } from "@/components/ui/latex-renderer"
import { MistakeViewer } from "./MistakeViewer"
import { formatKnowledgePoint } from "@/lib/format"

interface MistakeListProps {
  mistakes: any[]
}



export function MistakeList({ mistakes }: MistakeListProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mistakes.map((m: any) => (
          <Card key={m.id} className="group overflow-hidden border-primary/5 hover:border-primary/20 transition-all duration-500 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 flex flex-col">
            {/* Image Preview Area - Click to View High Res */}
            <div 
              className="relative aspect-[16/10] bg-zinc-50 overflow-hidden cursor-zoom-in border-b border-primary/5"
              onClick={() => setSelectedImageUrl(m.question.images?.[0] || null)}
            >
              {m.question.images?.[0] ? (
                <Image 
                  src={m.question.images[0]} 
                  alt="题目图片" 
                  fill 
                  className="object-contain p-3 opacity-95 group-hover:opacity-100 transition-all duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground italic text-xs">
                  无预览图
                </div>
              )}
              
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-white/90 backdrop-blur-md text-[10px] px-2.5 py-1 rounded-full text-zinc-900 font-bold border border-zinc-200 shadow-sm">
                  {m.question.subject}
                </span>
                {m.status === "corrected" && (
                  <span className="bg-green-500 text-[10px] px-2.5 py-1 rounded-full text-white font-bold shadow-sm">
                    DONE
                  </span>
                )}
              </div>

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                 <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                    <Maximize2 className="w-4 h-4 text-zinc-900" />
                 </div>
              </div>
            </div>

            <CardHeader className="pb-2 space-y-1">
              <Link href={`/practice?id=${m.question.id}`}>
                <CardTitle className="text-xl font-bold line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                  {formatKnowledgePoint(m.question.knowledge_points?.[0]) || "整理中..."}
                </CardTitle>
              </Link>
              <div className="flex gap-1.5 flex-wrap min-h-[22px]">
                {m.question.knowledge_points?.map((kp: string) => (
                  <Link 
                    key={kp} 
                    href={`/knowledge/${encodeURIComponent(kp)}`}
                    className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    {formatKnowledgePoint(kp)}
                  </Link>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
              <Link href={`/practice?id=${m.question.id}`} className="block h-full">
                <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed border-l-2 border-primary/30 pl-4 py-1 hover:bg-primary/5 transition-colors cursor-pointer">
                  {m.question.error_analysis ? (
                     <LatexRenderer content={m.question.error_analysis} />
                  ) : (
                     "AI 正在生成深度诊断报告..."
                  )}
                </div>
              </Link>

                <div className="pt-4 border-t border-primary/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600">
                      <Calendar className="w-3 h-3 text-primary/40" />
                      <span>做题: {new Date(m.question.occurred_at || m.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/40 pl-4.5">
                      收录: {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground border border-primary/5 h-fit">
                    已向量化
                  </span>
                </div>
                <Link href={`/practice?id=${m.question.id}`} className="block mt-4">
                  <Button variant="default" size="lg" className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md hover:shadow-xl transition-all h-10 text-xs font-bold">
                    <BookOpen className="mr-2 h-3.5 w-3.5" /> 查看详情与强化练习
                  </Button>
                </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <MistakeViewer 
        imageUrl={selectedImageUrl || ""}
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
      />
    </>
  )
}
