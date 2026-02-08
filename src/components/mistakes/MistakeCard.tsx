
import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Maximize2, Calendar as CalendarIcon, Pencil, Check, X as XIcon, BrainCircuit, RefreshCw, CheckCircle2, Star, MoreVertical, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { LatexRenderer } from "@/components/ui/latex-renderer"
import { formatKnowledgePoint } from "@/lib/format"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export interface MistakeCardProps { 
  m: any
  isSelectionMode: boolean
  isSelected: boolean
  toggleSelection: (id: string) => void
  setSelectedImageUrl: (url: string | null) => void
  handleDelete: (id: string) => void
  isDeleting: string | null
  editingDateId: string | null
  setEditingDateId: (id: string | null) => void
  newDate: string
  setNewDate: (date: string) => void
  handleUpdateDate: (id: string) => void
  isUpdatingDate: string | null
}

export const MistakeCard = memo(({ 
  m, 
  isSelectionMode, 
  isSelected, 
  toggleSelection, 
  setSelectedImageUrl,
  handleDelete,
  isDeleting,
  editingDateId,
  setEditingDateId,
  newDate,
  setNewDate,
  handleUpdateDate,
  isUpdatingDate
}: MistakeCardProps) => {
  return (
    <Card 
      className={cn(
        "group overflow-hidden border-primary/5 hover:border-primary/20 transition-all duration-300 bg-card/40 backdrop-blur-sm shadow-sm flex flex-col relative",
        isSelected && "ring-2 ring-blue-500 border-blue-200 bg-blue-50/10 shadow-lg"
      )}
    >
      {isSelectionMode && (
        <div className="absolute top-2 right-2 z-30 animate-in zoom-in">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => toggleSelection(m.id)}
            className="w-6 h-6 rounded-full border-zinc-300 bg-white shadow-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all scale-110"
          />
        </div>
      )}
      
      {/* Image Preview Area */}
      <div 
        className={cn(
          "relative aspect-[16/10] bg-zinc-50 overflow-hidden cursor-zoom-in border-b border-primary/5 transition-all",
          isSelectionMode && "opacity-90"
        )}
        onClick={() => isSelectionMode ? toggleSelection(m.id) : setSelectedImageUrl(m.question.images?.[0] || null)}
      >
        {m.question.images?.[0] ? (
          <Image 
            src={m.question.images[0]} 
            alt="题目图片" 
            fill 
            className="object-contain p-3 opacity-95 group-hover:opacity-100 transition-all duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground italic text-xs">
            无预览图
          </div>
        )}
        
        <div className={cn(
          "absolute top-2 left-2 flex gap-1.5 z-10 transition-all",
          isSelectionMode && "translate-x-0" // Stay top-left
        )}>
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-zinc-200 px-2 py-0.5 rounded-md shadow-sm transition-opacity group-hover:bg-zinc-100">
            <span className="text-[9px] font-bold text-zinc-900 tracking-wider">
              {m.question.subject?.toUpperCase()}
            </span>
            {m.question.ai_model && (
              <>
                <div className="w-[1px] h-2.5 bg-zinc-200" />
                <div className="flex items-center gap-1 text-[9px] font-medium text-zinc-600">
                  <BrainCircuit className="w-2.5 h-2.5 text-blue-500" />
                  <span>{m.question.ai_model.split('/').pop()?.toUpperCase()}</span>
                </div>
              </>
            )}
          </div>
          {m.status === "corrected" && (
            <div className="bg-green-500/80 backdrop-blur-md text-[9px] px-2 py-0.5 rounded-md text-white font-black shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              DONE
            </div>
          )}
        </div>

        {/* Difficulty Level Indicator */}
        <div className="absolute bottom-2 left-2 z-10 flex gap-0.5 bg-black/20 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/10 group-hover:bg-black/40 transition-colors">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "w-2.5 h-2.5 transition-colors",
                i < (m.question.difficulty || 0) 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-white/20 text-white/20"
              )} 
            />
          ))}
        </div>

        {!isSelectionMode && (
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200 shadow-sm text-zinc-600 hover:text-zinc-900 hover:bg-white">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-zinc-200 min-w-[120px]">
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer flex items-center gap-2"
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                  disabled={isDeleting === m.id}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting === m.id ? "删除中..." : "删除记录"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

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
            <div className="space-y-0.5 max-w-[150px]">
              {editingDateId === m.question.id ? (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="text-[11px] border-2 border-primary/20 rounded-lg px-2 py-1 bg-white font-mono outline-none focus:border-primary transition-all shadow-sm"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button 
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg shrink-0"
                    onClick={() => handleUpdateDate(m.question.id)}
                    disabled={isUpdatingDate === m.question.id}
                  >
                    {isUpdatingDate === m.question.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button 
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-lg shrink-0"
                    onClick={() => setEditingDateId(null)}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="group/date flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 cursor-pointer hover:bg-zinc-100/50 px-1.5 py-0.5 -ml-1.5 rounded-md transition-colors w-fit"
                      onClick={(e) => {
                      e.stopPropagation();
                      setEditingDateId(m.question.id)
                      setNewDate(new Date(m.question.occurred_at || m.created_at).toISOString().split('T')[0])
                      }}>
                  <CalendarIcon className="w-3 h-3 text-primary/40" />
                  <span className="tabular-nums">做题: {new Date(m.question.occurred_at || m.created_at).toLocaleDateString()}</span>
                  <Pencil className="w-2.5 h-2.5 text-zinc-400 opacity-0 group-hover/date:opacity-100 transition-opacity ml-1" />
                </div>
              )}
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
  )
})
MistakeCard.displayName = "MistakeCard"
