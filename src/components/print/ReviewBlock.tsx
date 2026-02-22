"use client"

import { LatexRenderer } from "@/components/ui/latex-renderer"

interface ReviewBlockProps {
  index: number
  question: {
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
  showAnswer?: boolean
}

/**
 * 单个错题的打印块
 * 包含：错题内容 → 正确解析
 */
export function ReviewBlock({ index, question, showAnswer = true }: ReviewBlockProps) {
  const kps = Array.isArray(question.knowledge_points) ? question.knowledge_points : []
  const difficultyLabel = ['', '★', '★★', '★★★', '★★★★', '★★★★★']
  
  // Safe fallbacks for different data ingestion methods
  const finalAnswer = question.answer || question.meta_data?.solution
  const finalAnalysis = question.analysis || question.error_analysis

  return (
    <div className="review-block border-b border-zinc-300 pb-4 mb-4 last:border-b-0">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white text-sm font-bold print:bg-zinc-900 print:text-white">
            {index}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {kps.map((kp, i) => {
              // 简化: 取最后一个 "-" 之后的部分
              const short = String(kp).includes('-') ? String(kp).split('-').pop()?.trim() : String(kp)
              return (
                <span key={i} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200 print:bg-zinc-100">
                  {short}
                </span>
              )
            })}
          </div>
        </div>
        <div className="text-xs text-zinc-400">
          {question.difficulty ? difficultyLabel[question.difficulty] : ''}
          {question.subject && <span className="ml-2 text-zinc-500">{question.subject}</span>}
        </div>
      </div>

      {/* 题目内容 */}
      <div className="mb-4">
        {question.images && question.images[0] && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={question.images[0]} 
            alt={`题目 ${index} 原图`} 
            className="max-w-full max-h-[60mm] object-contain rounded-lg border border-zinc-200 mb-3 print:max-h-[60mm]"
          />
        )}
        <div className="text-sm leading-relaxed mb-4">
          <LatexRenderer content={question.content} />
        </div>

        {/* 正确解析 / 标准答案直接贴在错题下 */}
        {showAnswer && (finalAnswer || finalAnalysis) && (
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg print:bg-zinc-50 mt-2">
            <h4 className="text-xs font-bold text-zinc-700 mb-1">✅ 标准答案与解析</h4>
            {finalAnswer && (
              <div className="text-sm font-bold text-zinc-900 mb-1 break-inside-avoid">
                【答案】 <LatexRenderer content={finalAnswer} className="inline" />
              </div>
            )}
            {finalAnalysis && (
              <div className="text-sm text-zinc-700 mt-1 pt-1 border-t border-zinc-200 break-inside-avoid">
                <LatexRenderer content={finalAnalysis} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
