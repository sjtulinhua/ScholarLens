
import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Trash2, CheckCircle2, BrainCircuit, Star, Maximize2, Pencil, Check, X as XIcon, RefreshCw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { formatKnowledgePoint } from "@/lib/format"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface MistakeListViewProps {
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

export const MistakeListView = memo(({
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
}: MistakeListViewProps) => {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-3 rounded-xl border border-primary/5 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-200",
        isSelected && "ring-2 ring-blue-500 border-blue-200 bg-blue-50/10"
      )}
    >
      {/* 1. Selection Checkbox */}
      {isSelectionMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggleSelection(m.id)}
          className="w-5 h-5 rounded-md border-zinc-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shrink-0"
        />
      )}

      {/* 2. Thumbnail */}
      <div 
        className="relative w-24 h-16 bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100 shrink-0 cursor-zoom-in group/image"
        onClick={() => isSelectionMode ? toggleSelection(m.id) : setSelectedImageUrl(m.question.images?.[0] || null)}
      >
        {m.question.images?.[0] ? (
          <>
            <Image
              src={m.question.images[0]}
              alt="题目图片"
              fill
              className="object-cover"
              sizes="96px"
            />
             <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100">
                <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
             </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-300">
            <BookOpen className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* 3. Content Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 h-full justify-between py-0.5">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded tracking-wider uppercase">
                {m.question.subject}
            </span>
            <Link href={`/practice?id=${m.question.id}`} className="min-w-0">
                <h4 className="font-bold text-sm text-zinc-800 truncate hover:text-primary transition-colors cursor-pointer">
                    {formatKnowledgePoint(m.question.knowledge_points?.[0]) || "未分类题目"}
                </h4>
            </Link>
            {m.status === "corrected" && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Knowledge Points Badges */}
            <div className="flex gap-1 overflow-hidden">
                {m.question.knowledge_points?.slice(0, 2).map((kp: string) => (
                    <span key={kp} className="bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">
                        {formatKnowledgePoint(kp)}
                    </span>
                ))}
                {(m.question.knowledge_points?.length || 0) > 2 && (
                    <span className="bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">...</span>
                )}
            </div>
            
            <div className="w-[1px] h-3 bg-zinc-200" />
            
             {/* Difficulty Stars */}
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star 
                    key={i} 
                    className={cn(
                        "w-2.5 h-2.5",
                        i < (m.question.difficulty || 0) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "fill-zinc-200 text-zinc-200"
                    )} 
                    />
                ))}
            </div>
        </div>
      </div>

      {/* 4. Actions & Date */}
      <div className="flex flex-col items-end gap-2 shrink-0 h-full justify-between py-0.5">
        {/* Date Editor */}
        <div className="h-6 flex items-center justify-end">
             {editingDateId === m.question.id ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input 
                        type="date" 
                        className="w-24 text-[10px] border border-primary/20 rounded px-1 py-0.5 bg-white font-mono outline-none focus:border-primary transition-all"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        autoFocus
                    />
                    <Button 
                        size="icon" variant="ghost" className="h-5 w-5 text-green-600 hover:bg-green-50"
                        onClick={() => handleUpdateDate(m.question.id)}
                        disabled={isUpdatingDate === m.question.id}
                    >
                         {isUpdatingDate === m.question.id ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>}
                    </Button>
                    <Button 
                        size="icon" variant="ghost" className="h-5 w-5 text-zinc-400 hover:bg-zinc-50"
                        onClick={() => setEditingDateId(null)}
                    >
                        <XIcon className="w-3 h-3"/>
                    </Button>
                </div>
             ) : (
                <div 
                    className="group/date flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditingDateId(m.question.id)
                        setNewDate(new Date(m.question.occurred_at || m.created_at).toISOString().split('T')[0])
                    }}
                >
                    <span className="tabular-nums font-mono">{new Date(m.question.occurred_at || m.created_at).toLocaleDateString()}</span>
                    <Pencil className="w-3 h-3 opacity-0 group-hover/date:opacity-100 transition-opacity" />
                </div>
             )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
            <Link href={`/practice?id=${m.question.id}`}>
                 <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium text-zinc-500 hover:text-primary hover:bg-primary/5">
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    练习
                 </Button>
            </Link>
            
            {!isSelectionMode && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-zinc-400 hover:text-zinc-900">
                             <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            className="text-red-600 focus:text-red-700 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                            disabled={isDeleting === m.id}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            <span>删除记录</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </div>
    </div>
  )
})

MistakeListView.displayName = "MistakeListView"
