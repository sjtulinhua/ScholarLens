"use client"

import { useState, useRef, useActionState, useEffect, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, Plus, Scissors, Trash2, Calendar } from 'lucide-react'
import Image from "next/image"
import { processMistake, type UploadState } from "./actions"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
// import { ImageCropper } from "@/components/ui/image-cropper" // Not used currently
import { MistakeRegionSelector } from "@/components/ui/mistake-region-selector"
import { ModelSelector } from "@/components/ui/model-selector"

const getProgressWidth = (msg: string) => {
  if (msg.includes("上传")) return "25%"
  if (msg.includes("识别")) return "50%"
  if (msg.includes("分析")) return "75%"
  if (msg.includes("归档")) return "90%"
  return "100%"
}

const initialState: UploadState = {}

export default function UploadPage() {
  const router = useRouter()
  
  // 核心状态：原始图与摘录结果分离
  const [sourceEntries, setSourceEntries] = useState<{
    id: string;
    file: File;
    previewUrl: string;
  }[]>([])
  
  const [cropTasks, setCropTasks] = useState<{
    id: string;
    file: File;
    previewUrl: string;
    sourceId: string;
  }[]>([])

  // Modal State
  const [scanningId, setScanningId] = useState<string | null>(null)
  const [scanningImageUrl, setScanningImageUrl] = useState<string | null>(null)
  const [subject, setSubject] = useState<string>("")
  
  // Date State (YYYY-MM-DD)
  const [occurredAt, setOccurredAt] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [isDateChanged, setIsDateChanged] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [state, formAction, isPending] = useActionState(processMistake, initialState)
  const [progressMessage, setProgressMessage] = useState("正在上传图片...")

  // helper to dry up form action logic
  function finalFdAction(fd: FormData) {
     fd.append("subject", subject)
     fd.append("occurredAt", occurredAt)
     cropTasks.forEach(c => fd.append("image", c.file))
     formAction(fd)
  }

  // Effects
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/mistakes")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state.success, router])

  useEffect(() => {
    if (!isPending) {
        // Reset when not pending, ready for next time
        setProgressMessage("正在上传图片...")
        return
    }
    
    const messages = ["正在上传图片...", "AI 正在识别题目...", "分析原因与逻辑...", "正在归档..."]
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < messages.length) setProgressMessage(messages[step])
    }, 2000)
    return () => clearInterval(interval)
  }, [isPending])

  // Load saved subject preference
  useEffect(() => {
    const saved = localStorage.getItem("scholar_lens_last_subject")
    if (saved) setSubject(saved)
  }, [])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newEntries: any[] = []
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        const id = generateId()
        newEntries.push({ id, file, previewUrl: url })
      }
    })
    
    setSourceEntries(prev => {
      const next = [...prev, ...newEntries].slice(0, 10)
      return next
    })
  }

  const removeSource = (id: string) => {
    setSourceEntries(prev => {
      const entry = prev.find(e => e.id === id)
      if (entry) URL.revokeObjectURL(entry.previewUrl)
      const next = prev.filter(e => e.id !== id)
      return next
    })
  }

  const removeCrop = (id: string) => {
    setCropTasks(prev => {
      const entry = prev.find(e => e.id === id)
      if (entry) URL.revokeObjectURL(entry.previewUrl)
      return prev.filter(e => e.id !== id)
    })
  }

  const clearAllSources = () => {
    sourceEntries.forEach(entry => URL.revokeObjectURL(entry.previewUrl))
    setSourceEntries([])
    if (scanningId) {
      setScanningId(null)
      setScanningImageUrl(null)
    }
  }

  const handleSmartScanConfirm = async (regions: any[]) => {
    if (!scanningId || !scanningImageUrl) return
    const source = sourceEntries.find(s => s.id === scanningId)
    if (!source) return

    setIsDetecting(true)
    try {
      const img = document.createElement('img')
      img.src = scanningImageUrl
      await new Promise(resolve => { img.onload = resolve })

      const newCrops: any[] = []
      for (let i = 0; i < regions.length; i++) {
          const region = regions[i]
          const canvas = document.createElement('canvas')
          const [ymin, xmin, ymax, xmax] = region.box_2d
          
          const top = (ymin / 1000) * img.naturalHeight
          const left = (xmin / 1000) * img.naturalWidth
          const width = ((xmax - xmin) / 1000) * img.naturalWidth
          const height = ((ymax - ymin) / 1000) * img.naturalHeight

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          ctx.drawImage(img, left, top, width, height, 0, 0, width, height)

          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95))
          if (blob) {
              const file = new File([blob], `crop_${generateId()}.jpg`, { type: 'image/jpeg' })
              newCrops.push({
                  id: generateId(),
                  file,
                  previewUrl: URL.createObjectURL(file),
                  sourceId: scanningId
              })
          }
      }
      setCropTasks(prev => [...prev, ...newCrops])
      setScanningId(null)
      setScanningImageUrl(null)
    } catch (error) {
      console.error("Cropping failed:", error)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFiles(e.dataTransfer.files)
  }

  if (state.success) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-zinc-900">分析完成！</h1>
            <p className="text-zinc-500">
              AI 成功识别并归档了 <span className="text-blue-600 font-bold">{state.count}</span> 道错题
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 pt-4">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            <p className="text-sm text-zinc-400">正在前往错题本...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-50 flex flex-col overflow-hidden pt-16">
      {/* Top Config Bar */}
      <div className="fixed top-0 inset-x-0 h-16 bg-white border-b z-40 flex items-center px-6 justify-between gap-8">
        <div className="flex items-center gap-8 flex-1">
          <h1 className="text-lg font-bold text-zinc-900 whitespace-nowrap">错题录入工作台</h1>
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Select value={subject} onValueChange={(v) => { setSubject(v); localStorage.setItem("scholar_lens_last_subject", v); }}>
              <SelectTrigger className="h-10 w-[140px] bg-zinc-50 border-none shadow-none focus:ring-0">
                <SelectValue placeholder="选择科目" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="math">数学</SelectItem>
                <SelectItem value="physics">物理</SelectItem>
                <SelectItem value="chemistry">化学</SelectItem>
                <SelectItem value="english">英语</SelectItem>
                <SelectItem value="chinese">语文</SelectItem>
              </SelectContent>
            </Select>

            <div className={cn(
              "relative px-3 py-1.5 rounded-xl border border-zinc-200 transition-all group flex items-center gap-2",
              !isDateChanged ? "bg-orange-50 border-orange-200 animate-pulse" : "bg-zinc-50 border-transparent"
            )}>
              <Calendar className={cn("w-3.5 h-3.5", !isDateChanged ? "text-orange-500" : "text-zinc-400")} />
              <input
                type="date"
                value={occurredAt}
                onChange={(e) => {
                  setOccurredAt(e.target.value);
                  setIsDateChanged(true);
                }}
                className="bg-transparent border-none rounded-md text-xs font-bold text-zinc-900 focus:ring-0 outline-none cursor-pointer w-[110px] tabular-nums"
                title="确认做题日期"
              />
              {!isDateChanged && (
                <div className="absolute top-full mt-2 left-0 bg-orange-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg animate-bounce whitespace-nowrap z-50">
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-orange-600 rotate-45" />
                  请确认做题日期
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModelSelector />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
        {/* Left Sidebar: Source Images */}
        <div 
          className="w-64 bg-white border-r flex flex-col group/sidebar h-full overflow-hidden flex-shrink-0"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="p-4 border-b flex items-center justify-between bg-zinc-50/50 flex-shrink-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> 待处理原图
            </span>
            {sourceEntries.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md" 
                onClick={clearAllSources}
                title="清空所有原图"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {sourceEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4 border-2 border-dashed border-transparent group-hover/sidebar:border-blue-200 rounded-xl transition-all">
                <Upload className="w-8 h-8 mb-2 text-zinc-300" />
                <p className="text-[10px] uppercase font-bold text-zinc-400">拖拽文件至此上传</p>
              </div>
            ) : (
              sourceEntries.map(entry => (
                <div 
                  key={entry.id}
                  onClick={() => { setScanningId(entry.id); setScanningImageUrl(entry.previewUrl); }}
                  className={cn(
                    "relative aspect-[3/4] rounded-lg border-2 cursor-pointer transition-all p-1 bg-white",
                    scanningId === entry.id ? "border-blue-500 shadow-md scale-[1.02]" : "border-transparent hover:border-zinc-200"
                  )}
                >
                  <div className="relative w-full h-full rounded-md overflow-hidden bg-zinc-50">
                    <Image src={entry.previewUrl} alt="Source" fill className="object-cover" unoptimized />
                    <div className="absolute top-1 right-1">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-5 w-5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-red-500 hover:text-white shadow-sm"
                         onClick={(e) => { e.stopPropagation(); removeSource(entry.id); }}
                       >
                         <X className="w-3 h-3" />
                       </Button>
                    </div>
                    {cropTasks.some(c => c.sourceId === entry.id) && (
                      <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                        {cropTasks.filter(c => c.sourceId === entry.id).length} CUTS
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Crop Workbench (Bento Grid) */}
        <div 
          className="flex-1 flex flex-col bg-zinc-50/50 overflow-hidden group/workbench relative"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Dashboard Header */}
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                <Scissors className="w-6 h-6 text-blue-600" /> 待处理题目面版
              </h2>
              <p className="text-sm text-zinc-400">从左侧点击原图进行圈选，摘录的题目将自动进入此看板</p>
            </div>
            {cropTasks.length > 0 && (
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" onClick={() => setCropTasks([])}>
                <Trash2 className="w-4 h-4 mr-2" /> 清空所有题目
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-12">
             {cropTasks.length === 0 ? (
               <div 
                 className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-6 border-2 border-dashed border-zinc-200 rounded-[2.5rem] bg-zinc-50/30 group-hover/workbench:border-zinc-300 transition-all duration-500"
               >
                  <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center mx-auto shadow-sm group-hover/workbench:shadow-xl transition-all duration-700">
                    <ImageIcon className="w-10 h-10 text-zinc-300" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-zinc-400 tracking-tight">暂无摘录成果</p>
                    <p className="text-sm text-zinc-400 max-w-xs mx-auto">请从左侧已上传的试卷中点击图片，圈选您要摘录的错题。</p>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {cropTasks.map(crop => (
                   <div key={crop.id} className="group/crop relative aspect-square bg-white rounded-3xl border border-zinc-200/60 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col">
                      <div className="flex-1 relative bg-zinc-50/50 p-4">
                        <Image src={crop.previewUrl} alt="Crop" fill className="object-contain p-4 group-hover/crop:scale-110 transition-transform duration-500" unoptimized />
                      </div>
                      <div className="p-4 border-t border-zinc-50 flex items-center justify-between bg-white">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                              ORIGIN: {crop.sourceId.slice(0,4).toUpperCase()}
                            </span>
                         </div>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50"
                           onClick={() => removeCrop(crop.id)}
                         >
                           <X className="w-4 h-4" />
                         </Button>
                      </div>
                      
                      {/* Hover Overlay for quick actions if needed */}
                      <div className="absolute inset-x-0 top-0 p-4 opacity-0 group-hover/crop:opacity-100 transition-opacity">
                         <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm inline-flex items-center gap-2">
                           题号: {cropTasks.indexOf(crop) + 1}
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

          {/* Deep Analysis Action Footer - Centered & Elegant */}
          {cropTasks.length > 0 && (
            <div className="p-8 pt-0 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Button 
                variant="default"
                size="lg"
                className={cn(
                  "h-12 px-8 text-base font-bold shadow-xl hover:shadow-2xl transition-all rounded-full relative overflow-hidden",
                  isPending ? "bg-zinc-800 pr-12" : "bg-gradient-to-r from-zinc-900 to-zinc-800 hover:scale-105"
                )}
                disabled={isPending || !subject}
                onClick={() => {
                  if (!isDateChanged) {
                    const confirmDate = window.confirm(`当前的“做题日期”默认是今天 (${occurredAt})。\n如果是补录之前的错题，建议修改后再分析。\n\n确定以当前日期继续吗？`)
                    if (!confirmDate) return
                    setIsDateChanged(true) // 标记为已确认，不再弹出
                  }
                  const fd = new FormData()
                  startTransition(() => {
                    finalFdAction(fd)
                  })
                }}
              >
                {isPending ? (
                  <>
                    <div className="absolute inset-0 bg-white/10 animate-pulse transition-all duration-1000" style={{ width: getProgressWidth(progressMessage) }} />
                    <div className="relative flex items-center gap-3 z-10">
                      <span>{progressMessage}</span>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    { !subject ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-400">请先选择科目以开始</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>开始深度分析</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{cropTasks.length}</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Error Feedback */}
          {state.error && (
            <div className="px-8 pb-8 flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm max-w-md">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-sm font-medium">
                   分析失败: {state.error}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-100/50 rounded-full ml-4"
                  onClick={() => {
                    // Logic to clear error if needed, or just let user re-click
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />

      {scanningImageUrl && (
        <MistakeRegionSelector
          imageUrl={scanningImageUrl}
          onConfirm={handleSmartScanConfirm}
          onCancel={() => { setScanningId(null); setScanningImageUrl(null); }}
          isAnalyzing={isDetecting}
        />
      )}
    </div>
  )
}
