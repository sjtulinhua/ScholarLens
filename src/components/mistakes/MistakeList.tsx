"use client"

import { useState, useCallback, useOptimistic, startTransition } from "react"
import { MistakeViewer } from "./MistakeViewer"
import { MistakeCard } from "./MistakeCard"
import { MistakeListView } from "./MistakeListView"
import { MistakeGroupedView } from "./MistakeGroupedView" 
import { Button } from "@/components/ui/button"
import { 
  X as XIcon, 
  CheckCircle2, 
  Trash2, 
  RefreshCw, 
  LayoutGrid, 
  List as ListIcon, 
  Layers,
  Archive,
  Filter
} from "lucide-react"
import { deleteMistake, updateMistakeDate, bulkDeleteMistakes } from "@/app/mistakes/actions"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MistakeListProps {
  mistakes: any[]
}

type OptimisticAction = 
  | { type: 'delete'; id: string }
  | { type: 'bulk-delete'; ids: string[] }

export function MistakeList({ mistakes }: MistakeListProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUpdatingDate, setIsUpdatingDate] = useState<string | null>(null)
  
  // Selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grouped'>('grid')

  // Optimistic UI for instant feedback
  const [optimisticMistakes, dispatchOptimistic] = useOptimistic(
    mistakes,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'delete':
          return state.filter(m => m.id !== action.id)
        case 'bulk-delete':
          return state.filter(m => !action.ids.includes(m.id))
        default:
          return state
      }
    }
  )

  const handleDelete = async (id: string) => {
    // Optimistic delete: no confirmation to slow down flow?
    // User requested speed. But usually confirmation is safer.
    // Let's keep confirmation but remove spinner delay.
    if (!confirm("确定要删除这条错题记录吗？(可去垃圾箱还原)")) return
    
    startTransition(async () => {
        // 1. Instant UI update
        dispatchOptimistic({ type: 'delete', id })
        
        // 2. Server Action
        try {
            await deleteMistake(id)
        } catch (e) {
            // Restore? Next.js useOptimistic reverts automatically if we don't return?
            // Actually reloading page handles sync.
            alert("删除失败")
        }
    })
  }

  const handleUpdateDate = async (questionId: string) => {
    if (!newDate) return
    setIsUpdatingDate(questionId)
    try {
      await updateMistakeDate(questionId, newDate)
      setEditingDateId(null)
    } catch (e) {
      alert("更新日期失败")
    } finally {
      setIsUpdatingDate(null)
    }
  }

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }, [])

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`确定要批量删除这 ${selectedIds.length} 条错题记录吗？`)) return
    
    startTransition(async () => {
        const idsToDelete = [...selectedIds]
        
        // 1. Instant UI update
        dispatchOptimistic({ type: 'bulk-delete', ids: idsToDelete })
        
        // Clear selection immediately
        setIsSelectionMode(false)
        setSelectedIds([])

        // 2. Server Action
        try {
            await bulkDeleteMistakes(idsToDelete)
        } catch (e) {
            alert("批量删除失败")
        }
    })
  }

  const toggleAll = () => {
    if (selectedIds.length === mistakes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(mistakes.map(m => m.id))
    }
  }

  // Common props passed to all views
  // Note: We pass optimisticMistakes to views!
  const commonProps = {
    isSelectionMode,
    toggleSelection,
    setSelectedImageUrl,
    handleDelete,
    isDeleting, // Unused for delete now, but kept for type compat
    editingDateId,
    setEditingDateId,
    newDate,
    setNewDate,
    handleUpdateDate,
    isUpdatingDate
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4 items-center bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-primary/5 sticky top-20 z-20 shadow-sm">
        
        {/* Left Side: Stats or Filters */}
        <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-bold text-muted-foreground">{optimisticMistakes.length} 题已收录</span>
            <div className="h-4 w-[1px] bg-border mx-2" />
            
             {/* Placeholder for future filters */}
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" disabled>
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                筛选
            </Button>
             <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" disabled>
                <Archive className="w-3.5 h-3.5 mr-1.5" />
                归档
            </Button>
        </div>

        {/* Right Side: View Switcher & Actions */}
        <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50 flex">
                <ToggleGroup type="single" value={viewMode} onValueChange={(v: string) => v && setViewMode(v as 'grid' | 'list' | 'grouped')}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="grid" aria-label="网格视图" className="h-7 w-7 p-0 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-primary transition-all">
                                <LayoutGrid className="h-4 w-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            <p>网格视图：通览错题图片</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="list" aria-label="列表视图" className="h-7 w-7 p-0 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-primary transition-all">
                                <ListIcon className="h-4 w-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                             <p>列表视图：紧凑展示，适合快速扫描</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="grouped" aria-label="分组视图" className="h-7 w-7 p-0 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-primary transition-all">
                                <Layers className="h-4 w-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                             <p>分组视图：按知识点分类，聚焦薄弱点</p>
                        </TooltipContent>
                    </Tooltip>
                </ToggleGroup>
            </div>

            <div className="h-4 w-[1px] bg-border mx-1" />

            {/* 批量管理开关 */}
            <Button 
            variant={isSelectionMode ? "secondary" : "default"} 
            size="sm" 
            className={cn(
                "rounded-lg h-9 px-4 font-bold transition-all shadow-sm text-xs",
                isSelectionMode 
                    ? "bg-zinc-200 text-zinc-900 hover:bg-zinc-300" 
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
            onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                if (isSelectionMode) setSelectedIds([])
            }}
            >
            {isSelectionMode ? (
                <>
                <XIcon className="w-3.5 h-3.5 mr-1.5" />
                退出
                </>
            ) : (
                <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                批量管理
                </>
            )}
            </Button>
        </div>
      </div>

      {/* 悬浮底部操作栏（固定在屏幕底部） */}
      {isSelectionMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-fit animate-in slide-in-from-bottom-8 fade-in duration-500 fill-mode-forwards">
          <div className="bg-zinc-900 text-white rounded-2xl p-2 pl-6 shadow-2xl border border-white/10 flex items-center gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black tracking-widest text-white/50 uppercase">
                Selection <span className="text-blue-400 ml-1">{selectedIds.length}</span>
              </span>
              <div className="w-[1px] h-4 bg-white/10" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 h-8"
                onClick={toggleAll}
              >
                {selectedIds.length === optimisticMistakes.length ? "取消全选" : "全选当前"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-xl h-10 px-5 font-bold shadow-lg shadow-red-500/20"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting || selectedIds.length === 0}
              >
                {isBulkDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除已选
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedIds([])
                }}
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Rendering (Use optimisticMistakes) */}
      <div className={cn(
        "animate-in fade-in duration-500 min-h-[500px]",
        viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
        viewMode === 'list' && "space-y-3",
        viewMode === 'grouped' && "space-y-6"
      )}>
        {viewMode === 'grouped' ? (
           <MistakeGroupedView 
              mistakes={optimisticMistakes}
              {...commonProps}
              isSelected={false}
           />
        ) : (
            optimisticMistakes.map((m: any) => {
                const isSelected = selectedIds.includes(m.id)
                if (viewMode === 'list') {
                    return (
                        <MistakeListView
                            key={m.id}
                            m={m}
                            {...commonProps}
                            isSelected={isSelected}
                        />
                    )
                }
                return (
                    <MistakeCard 
                        key={m.id}
                        m={m}
                        {...commonProps}
                        isSelected={isSelected}
                    />
                )
            })
        )}
      </div>

      <MistakeViewer 
        imageUrl={selectedImageUrl || ""}
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
      />
    </TooltipProvider>
  )
}
