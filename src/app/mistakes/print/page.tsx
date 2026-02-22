"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Printer, Loader2, AlertTriangle, BookOpen, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ReviewBlock } from "@/components/print/ReviewBlock"
import { getReviewQuestions } from "./actions"

interface QuestionData {
  id: string
  content: string
  images?: string[]
  subject: string
  knowledge_points?: string[]
  error_type?: string
  analysis?: string
  error_analysis?: string
  answer?: string
  difficulty?: number
  meta_data?: any
  created_at: string
  occurred_at?: string
}

export default function PrintPreviewPage() {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get("ids")

  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(true)

  // 1. 加载所有选中错题
  useEffect(() => {
    async function loadQuestions() {
      if (!idsParam) {
        setError("未指定题目 ID")
        setLoading(false)
        return
      }

      const ids = idsParam.split(",").filter(Boolean)
      if (ids.length === 0) {
        setError("未指定题目 ID")
        setLoading(false)
        return
      }

      const result = await getReviewQuestions(ids)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // 按照原始 ids 顺序排列（保持用户选择的顺序）
      const sorted = ids
        .map(id => result.data?.find((q: any) => q.id === id))
        .filter(Boolean) as QuestionData[]

      setQuestions(sorted)
      setLoading(false)
    }

    loadQuestions()
  }, [idsParam])



  // 3. 打印
  const handlePrint = useCallback(() => {
    // 等待 KaTeX 渲染完成（给 100ms buffer）
    setTimeout(() => {
      window.print()
    }, 200)
  }, [])

  // Loading 状态
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">正在加载复习资料...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  // 空状态
  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">没有找到指定的错题</p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

  return (
    <>
      {/* 打印专用样式 */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .review-block { 
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 20px !important;
            padding-bottom: 20px !important;
          }
          img { 
            max-width: 100% !important; 
            max-height: 45mm !important; 
          }
          .print-container {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            margin: 10mm 12mm;
          }
        }
      `}</style>

      {/* 悬浮打印操作栏（打印时隐藏） */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">考前复习卷</span>
            <span className="text-xs text-muted-foreground mr-4">共 {questions.length} 题</span>
            
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
              <Switch 
                id="show-answer" 
                checked={showAnswer} 
                onCheckedChange={setShowAnswer} 
              />
              <label htmlFor="show-answer" className="text-sm font-medium cursor-pointer flex items-center gap-1.5 select-none">
                {showAnswer ? <Eye className="h-4 w-4 text-zinc-600" /> : <EyeOff className="h-4 w-4 text-zinc-400" />}
                {showAnswer ? "附带答案解析" : "隐藏答案解析"}
              </label>
            </div>
          </div>
          <Button 
            onClick={handlePrint} 
            className="rounded-full shadow-md"
          >
            <Printer className="h-4 w-4 mr-2" />
            打印 / 保存PDF
          </Button>
        </div>
      </div>

      {/* 打印内容区（A4 宽度限制） */}
      <div className="print-container max-w-4xl mx-auto px-6 pt-20 pb-12">
        {/* 标题区 */}
        <div className="text-center mb-8 pb-6 border-b-2 border-zinc-900">
          <h1 className="text-2xl font-bold tracking-tight mb-1">📋 考前错题复习卷</h1>
          <p className="text-sm text-zinc-500">
            ScholarLens · {dateStr} · 共 {questions.length} 题
          </p>
        </div>

        {/* 错题列表 */}
        {questions.map((q, i) => (
          <ReviewBlock
            key={q.id}
            index={i + 1}
            question={q}
            showAnswer={showAnswer}
          />
        ))}

        {/* 页脚 */}
        <div className="text-center text-xs text-zinc-400 mt-12 pt-4 border-t border-zinc-200">
          本复习卷由 ScholarLens AI 智能生成 · {dateStr}
        </div>
      </div>
    </>
  )
}
