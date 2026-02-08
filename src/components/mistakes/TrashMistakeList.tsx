
"use client"

import { useState } from "react"
import { MistakeViewer } from "./MistakeViewer"
import { MistakeCard } from "./MistakeCard"
import { Button } from "@/components/ui/button"
import { 
  X as XIcon, 
  CheckCircle2, 
  Trash2, 
  RefreshCw,
  ArchiveRestore
} from "lucide-react"
import { restoreMistake, permanentDeleteMistake, bulkRestoreMistakes, bulkPermanentDeleteMistakes } from "@/app/mistakes/actions"
import { cn } from "@/lib/utils"

interface TrashMistakeListProps {
  mistakes: any[]
}

export function TrashMistakeList({ mistakes }: TrashMistakeListProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  
  // Selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  const handleRestore = async (id: string) => {
    setIsProcessing(id)
    try {
      await restoreMistake(id)
    } catch (e) {
      alert("还原失败")
    } finally {
      setIsProcessing(null)
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("⚠️ 彻底删除后无法恢复！确定要永久删除吗？")) return
    setIsProcessing(id)
    try {
      await permanentDeleteMistake(id)
    } catch (e) {
      alert("永久删除失败")
    } finally {
      setIsProcessing(null)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return
    setIsBulkProcessing(true)
    try {
      await bulkRestoreMistakes(selectedIds)
      setSelectedIds([])
      setIsSelectionMode(false)
    } catch (e) {
      alert("批量还原失败")
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`⚠️ 确定要永久删除这 ${selectedIds.length} 条记录吗？此操作无法撤销！`)) return
    
    setIsBulkProcessing(true)
    try {
      await bulkPermanentDeleteMistakes(selectedIds)
      setSelectedIds([])
      setIsSelectionMode(false)
    } catch (e) {
      alert("批量永久删除失败")
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const toggleAll = () => {
    if (selectedIds.length === mistakes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(mistakes.map(m => m.id))
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-end gap-4 items-center">
        {/* 批量管理开关 */}
        <Button 
          variant={isSelectionMode ? "secondary" : "outline"} 
          size="sm" 
          className="rounded-full h-10 px-6 font-bold transition-all shadow-sm border-zinc-200"
          onClick={() => {
            setIsSelectionMode(!isSelectionMode)
            if (isSelectionMode) setSelectedIds([])
          }}
        >
          {isSelectionMode ? (
            <>
              <XIcon className="w-4 h-4 mr-2" />
              退出管理
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              批量管理
            </>
          )}
        </Button>
      </div>

      {/* 悬浮底部操作栏 */}
      {isSelectionMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-fit animate-in slide-in-from-bottom-8 fade-in duration-500 fill-mode-forwards">
          <div className="bg-zinc-900 text-white rounded-2xl p-2 pl-6 shadow-2xl border border-white/10 flex items-center gap-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black tracking-widest text-white/50 uppercase">
                Selected <span className="text-blue-400 ml-1">{selectedIds.length}</span>
              </span>
              <div className="w-[1px] h-4 bg-white/10" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 h-8"
                onClick={toggleAll}
              >
                {selectedIds.length === mistakes.length ? "取消" : "全选"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-xl h-10 px-4 font-bold bg-green-600 hover:bg-green-500 text-white border-0"
                onClick={handleBulkRestore}
                disabled={isBulkProcessing || selectedIds.length === 0}
              >
                {isBulkProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    还原
                  </>
                )}
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-xl h-10 px-4 font-bold"
                onClick={handleBulkPermanentDelete}
                disabled={isBulkProcessing || selectedIds.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                彻底删除
              </Button>
            </div>
            
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 ml-2"
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedIds([])
                }}
              >
                <XIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mistakes.map((m: any) => {
            const isSelected = selectedIds.includes(m.id)
            return (
                <div key={m.id} className="relative group">
                    <MistakeCard 
                        m={m}
                        isSelectionMode={isSelectionMode}
                        isSelected={isSelected}
                        toggleSelection={toggleSelection}
                        setSelectedImageUrl={setSelectedImageUrl}
                        // Disable interactions not relevant for trash
                        handleDelete={() => {}} 
                        isDeleting={null}
                        editingDateId={null}
                        setEditingDateId={() => {}}
                        newDate=""
                        setNewDate={() => {}}
                        handleUpdateDate={() => Promise.resolve({success: true})}
                        isUpdatingDate={null}
                    />
                    
                    {/* Overlay for specific trash actions if not in selection mode */}
                    {!isSelectionMode && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 rounded-xl border-2 border-dashed border-red-200">
                             <div className="flex gap-2 scale-90 group-hover:scale-100 transition-transform duration-200">
                                <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                                    onClick={() => handleRestore(m.id)}
                                    disabled={isProcessing === m.id}
                                >
                                    <ArchiveRestore className="w-4 h-4 mr-1.5" />
                                    还原
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="shadow-lg"
                                    onClick={() => handlePermanentDelete(m.id)}
                                    disabled={isProcessing === m.id}
                                >
                                    <Trash2 className="w-4 h-4 mr-1.5" />
                                    彻底删除
                                </Button>
                             </div>
                        </div>
                    )}
                    
                    {/* Deleted badge */}
                    <div className="absolute top-3 right-3 z-0 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded border border-red-200 uppercase tracking-wider">
                        Deleted
                    </div>
                </div>
            )
        })}
      </div>

      <MistakeViewer 
        imageUrl={selectedImageUrl || ""}
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
      />
    </>
  )
}
