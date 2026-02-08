"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Check, X, Plus, Trash2, AlertCircle, ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react'
import { cn } from "@/lib/utils"

// Normalized coordinates (0-1000) as per Gemini standard
export type Box2D = [number, number, number, number] // ymin, xmin, ymax, xmax

export interface Region {
  id: string
  box_2d: Box2D
  label?: string
}

interface MistakeRegionSelectorProps {
  imageUrl: string
  initialRegions?: Region[]
  onConfirm: (regions: Region[]) => void
  onCancel: () => void
  isAnalyzing?: boolean
  isInline?: boolean
}

export function MistakeRegionSelector({ 
  imageUrl, 
  initialRegions = [], 
  onConfirm, 
  onCancel,
  isAnalyzing = false,
  isInline = false
}: MistakeRegionSelectorProps) {
  const [regions, setRegions] = useState<Region[]>(initialRegions)
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  
  // Interaction State
  const [tool, setTool] = useState<'draw' | 'pan'>('draw')
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null)

  // Dragging/Resizing/Moving state
  const [activeAction, setActiveAction] = useState<'draw' | 'resize' | 'move' | null>(null)
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null) // n, s, e, w, nw, ne, sw, se
  const [initialBox, setInitialBox] = useState<Box2D | null>(null)
  const [tempRegion, setTempRegion] = useState<Box2D | null>(null) 
  const [activeDraftBox, setActiveDraftBox] = useState<Box2D | null>(null)

  // Initialize generic ID generator
  const generateId = () => Math.random().toString(36).substr(2, 9)

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (type === 'in') setZoom(prev => Math.min(prev + 0.2, 5))
    else if (type === 'out') setZoom(prev => Math.max(prev - 0.2, 0.5))
    else {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  // Convert pixels to normalized (0-1000)
  const toNormalized = (rect: {top: number, left: number, width: number, height: number}, imgWidth: number, imgHeight: number): Box2D => {
    const ymin = Math.round((rect.top / imgHeight) * 1000)
    const xmin = Math.round((rect.left / imgWidth) * 1000)
    const ymax = Math.round(((rect.top + rect.height) / imgHeight) * 1000)
    const xmax = Math.round(((rect.left + rect.width) / imgWidth) * 1000)
    return [
      Math.max(0, Math.min(1000, ymin)),
      Math.max(0, Math.min(1000, xmin)),
      Math.max(0, Math.min(1000, ymax)),
      Math.max(0, Math.min(1000, xmax))
    ]
  }

  // Convert normalized (0-1000) to pixel coordinates
  const toPixels = (box: Box2D, width: number, height: number) => {
    const [ymin, xmin, ymax, xmax] = box
    return {
      top: (ymin / 1000) * height,
      left: (xmin / 1000) * width,
      width: ((xmax - xmin) / 1000) * width,
      height: ((ymax - ymin) / 1000) * height
    }
  }

  // Effect: Handle Spacebar for Pan Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setTool('pan')
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setTool('draw')
        setIsPanning(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Effect: Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => {
        const newZoom = Math.max(0.1, Math.min(5, prev + delta))
        return parseFloat(newZoom.toFixed(2))
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // 0. Handle Panning first
    if (e.button === 1 || e.button === 2 || tool === 'pan') {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    if (!containerRef.current || !imageRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    const imgW = imageRef.current.width
    const imgH = imageRef.current.height

    // 1. Check Handles of selected region first (highest priority)
    if (selectedRegionId) {
      const selected = regions.find(r => r.id === selectedRegionId)
      if (selected) {
        const box = toPixels(selected.box_2d, imgW, imgH)
        const hitSlop = 16 / zoom
        
        const handles = [
          { id: 'nw', x: box.left, y: box.top },
          { id: 'ne', x: box.left + box.width, y: box.top },
          { id: 'sw', x: box.left, y: box.top + box.height },
          { id: 'se', x: box.left + box.width, y: box.top + box.height },
          { id: 'n', x: box.left + box.width / 2, y: box.top },
          { id: 's', x: box.left + box.width / 2, y: box.top + box.height },
          { id: 'w', x: box.left, y: box.top + box.height / 2 },
          { id: 'e', x: box.left + box.width, y: box.top + box.height / 2 }
        ]

        for (const h of handles) {
          if (Math.abs(x - h.x) < hitSlop && Math.abs(y - h.y) < hitSlop) {
            setActiveAction('resize')
            setResizeHandle(h.id)
            setDragStart({ x, y })
            setInitialBox([...selected.box_2d])
            return
          }
        }
      }
    }

    // 2. Check if clicked inside any existing region (Move or Select)
    // Iterate backwards to hit top-most regions first
    for (let i = regions.length - 1; i >= 0; i--) {
        const r = regions[i]
        const box = toPixels(r.box_2d, imgW, imgH)
        if (x >= box.left && x <= box.left + box.width && y >= box.top && y <= box.top + box.height) {
            setSelectedRegionId(r.id)
            setActiveAction('move')
            setDragStart({ x, y })
            setInitialBox([...r.box_2d])
            return
        }
    }

    // 3. Default: Background click -> Draw mode or Deselect
    setActiveAction('draw')
    setDragStart({ x, y })
    setSelectedRegionId(null) 
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      return
    }

    if (!activeAction || !dragStart || !containerRef.current || !imageRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) / zoom
    const currentY = (e.clientY - rect.top) / zoom
    const dx = currentX - dragStart.x
    const dy = currentY - dragStart.y

    if (activeAction === 'draw') {
        const top = Math.min(dragStart.y, currentY)
        const left = Math.min(dragStart.x, currentX)
        const width = Math.abs(currentX - dragStart.x)
        const height = Math.abs(currentY - dragStart.y)
        setTempRegion(toNormalized({ top, left, width, height }, rect.width / zoom, rect.height / zoom))
    } 
    else if (activeAction === 'move' && initialBox && selectedRegionId) {
        const [ymin, xmin, ymax, xmax] = initialBox
        const imgW = imageRef.current.width
        const imgH = imageRef.current.height
        const nx = (dx / imgW) * 1000
        const ny = (dy / imgH) * 1000
        
        const newBox: Box2D = [
            Math.max(0, Math.min(1000 - (ymax - ymin), ymin + ny)),
            Math.max(0, Math.min(1000 - (xmax - xmin), xmin + nx)),
            0, 0
        ]
        newBox[2] = newBox[0] + (ymax - ymin)
        newBox[3] = newBox[1] + (xmax - xmin)

        setActiveDraftBox(newBox)
    }
    else if (activeAction === 'resize' && initialBox && resizeHandle && selectedRegionId) {
        let [ymin, xmin, ymax, xmax] = initialBox
        const imgW = imageRef.current.width
        const imgH = imageRef.current.height
        const nx = (dx / imgW) * 1000
        const ny = (dy / imgH) * 1000

        if (resizeHandle.includes('n')) ymin = Math.max(0, Math.min(ymax - 10, ymin + ny))
        if (resizeHandle.includes('s')) ymax = Math.max(ymin + 10, Math.min(1000, ymax + ny))
        if (resizeHandle.includes('w')) xmin = Math.max(0, Math.min(xmax - 10, xmin + nx))
        if (resizeHandle.includes('e')) xmax = Math.max(xmin + 10, Math.min(1000, xmax + nx))

        setActiveDraftBox([ymin, xmin, ymax, xmax])
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      setPanStart(null)
      return
    }
    
    if (activeAction === 'draw' && tempRegion) {
        const [ymin, xmin, ymax, xmax] = tempRegion
        if ((ymax - ymin) > 20 && (xmax - xmin) > 20) {
            const newRegion: Region = {
                id: generateId(),
                box_2d: tempRegion,
                label: 'mistake'
            }
            setRegions([...regions, newRegion])
            setSelectedRegionId(newRegion.id)
        }
    } else if (activeDraftBox && selectedRegionId) {
        setRegions(regions.map(r => r.id === selectedRegionId ? { ...r, box_2d: activeDraftBox } : r))
    }
    
    setActiveAction(null)
    setDragStart(null)
    setTempRegion(null)
    setInitialBox(null)
    setResizeHandle(null)
    setActiveDraftBox(null)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }

  const handleDelete = (id: string) => {
    setRegions(regions.filter(r => r.id !== id))
    if (selectedRegionId === id) setSelectedRegionId(null)
  }

  return (
    <div className={cn(
        isInline ? "relative w-full h-full" : "fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
    )}>
      <div className={cn(
          "bg-white flex flex-col overflow-hidden",
          isInline ? "w-full h-full" : "rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] animate-in zoom-in-95 duration-200"
      )}>
        
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                手动圈选错题
              </h3>
              <p className="text-xs text-muted-foreground">
                请直接框选题目区域。右键拖拽可移动图片，滚轮缩放。
              </p>
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600" onClick={() => handleZoom('out')} disabled={zoom <= 0.1}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <div className="px-2 text-xs font-medium text-zinc-500 w-12 text-center">
                {Math.round(zoom * 100)}%
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600" onClick={() => handleZoom('in')} disabled={zoom >= 5}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <div className="w-[1px] h-4 bg-zinc-200 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600" onClick={() => handleZoom('reset')}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              取消
            </Button>
            <Button size="sm" onClick={() => onConfirm(regions)} disabled={regions.length === 0}>
              {`确认 (${regions.length} 题)`}
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div 
            className="flex-1 bg-zinc-200/50 relative select-none overflow-hidden flex items-center justify-center"
            onWheel={handleWheel} // Move onWheel here to capture all scroll events in canvas
            onContextMenu={handleContextMenu}
        >
            <div
                ref={containerRef}
                className={cn(
                    "relative shadow-2xl ring-1 ring-zinc-900/10 bg-white transition-transform duration-75 ease-out origin-center",
                    tool === 'pan' || isPanning ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
                )}
                style={{ 
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img 
                ref={imageRef}
                onLoad={() => {
                    // Reset zoom/pan on load
                    setZoom(1)
                    setPan({x: 0, y: 0})
                }}
                src={imageUrl} 
                alt="Scan" 
                className="max-h-[85vh] max-w-[90vw] w-auto h-auto object-contain pointer-events-none select-none block"
                draggable={false}
                />

            {/* Render Existing Regions */}
            {regions.map((region, idx) => {
                if (!imageRef.current) return null
                const isSelected = selectedRegionId === region.id
                const box2d = (isSelected && activeDraftBox) ? activeDraftBox : region.box_2d
                const style = toPixels(box2d, imageRef.current.width, imageRef.current.height)

                return (
                    <div
                        key={region.id}
                        className={cn(
                            "absolute border-2 transition-all",
                            (activeAction && isSelected) ? "duration-0" : "duration-75",
                            isSelected 
                                ? "border-blue-500 bg-blue-500/10 z-20 cursor-move" 
                                : "border-red-500/60 hover:border-red-500 bg-red-500/5 z-10 cursor-pointer"
                        )}
                        style={style}
                        onMouseDown={(e) => {
                            // Let the parent container handle all picking logic
                        }}
                    >
                        {/* Handles for resizing (only if selected) */}
                        {isSelected && (
                            <>
                                {[
                                    { pos: 'nw', class: 'top-[-5px] left-[-5px] cursor-nwse-resize' },
                                    { pos: 'ne', class: 'top-[-5px] right-[-5px] cursor-nesw-resize' },
                                    { pos: 'sw', class: 'bottom-[-5px] left-[-5px] cursor-nesw-resize' },
                                    { pos: 'se', class: 'bottom-[-5px] right-[-5px] cursor-nwse-resize' },
                                    { pos: 'n', class: 'top-[-5px] left-[calc(50%-5px)] cursor-ns-resize' },
                                    { pos: 's', class: 'bottom-[-5px] left-[calc(50%-5px)] cursor-ns-resize' },
                                    { pos: 'w', class: 'top-[calc(50%-5px)] left-[-5px] cursor-ew-resize' },
                                    { pos: 'e', class: 'top-[calc(50%-5px)] right-[-5px] cursor-ew-resize' }
                                ].map(h => (
                                    <div 
                                        key={h.pos}
                                        className={cn("absolute w-2.5 h-2.5 bg-blue-600 border border-white rounded-sm shadow-sm z-30", h.class)}
                                    />
                                ))}
                            </>
                        )}

                        {/* Delete Button (visible on hover or selected) */}
                        <button
                            className={cn(
                                "absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-40 group",
                                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(region.id)
                            }}
                        >
                            <X className="w-3 h-3" />
                        </button>

                        {/* Label Badge */}
                        <div className="absolute top-1 left-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded shadow-sm text-zinc-700 font-bold pointer-events-none select-none">
                           题目 {idx + 1}
                        </div>
                    </div>
                )
            })}

            {/* Render Temp Region (Drawing) */}
            {tempRegion && imageRef.current && (
                <div 
                    className="absolute border-2 border-blue-400 bg-blue-400/20 z-30 pointer-events-none"
                    style={toPixels(tempRegion, imageRef.current.width, imageRef.current.height)}
                />
            )}
            </div>
          </div>

        {/* Footer Hint */}
        <div className="p-3 border-t bg-zinc-50 text-xs text-zinc-500 text-center flex items-center justify-center gap-4 border-t-zinc-200">
            <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-red-500/60 rounded-sm"></span> AI 推荐</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-blue-500 rounded-sm bg-blue-500/10"></span> 当前选中</span>
            <div className="w-[1px] h-3 bg-zinc-300 mx-2" />
            <span className="font-medium text-zinc-600">Space+拖拽 / 中键平移 / 滚轮缩放</span>
        </div>
      </div>
    </div>
  )
}
