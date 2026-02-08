"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw, X, Maximize2 } from 'lucide-react'
import { cn } from "@/lib/utils"

interface MistakeViewerProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
}

export function MistakeViewer({ imageUrl, isOpen, onClose }: MistakeViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number, y: number } | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Reset state when opening a new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }, [isOpen, imageUrl])

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (type === 'in') setZoom(prev => Math.min(prev + 0.5, 10))
    else if (type === 'out') setZoom(prev => Math.max(prev - 0.5, 0.1))
    else {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.max(0.1, Math.min(10, prev + delta)))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // 右键或中键或左键都允许平移（因为这是查看器，平移是第一优先级）
    e.preventDefault()
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setPanStart(null)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden bg-zinc-950/95 border-none dark">
        <DialogTitle className="sr-only">题目详情查看</DialogTitle>
        
        {/* Controls Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1.5 px-4 shadow-2xl">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => handleZoom('out')}>
              <ZoomOut className="w-4 h-4" />
           </Button>
           <div className="text-[11px] font-mono text-white/70 w-12 text-center select-none">
             {Math.round(zoom * 100)}%
           </div>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => handleZoom('in')}>
              <ZoomIn className="w-4 h-4" />
           </Button>
           <div className="w-[1px] h-4 bg-white/10 mx-1" />
           <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => handleZoom('reset')}>
              <RotateCcw className="w-4 h-4" />
           </Button>
        </div>

        {/* Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 z-50 rounded-full bg-black/40 hover:bg-white/20 text-white" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Canvas Area */}
        <div 
          className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden flex items-center justify-center p-8"
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
            <div
              className="relative transition-transform duration-75 ease-out"
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Mistake Detail"
                className="max-h-[80vh] max-w-[85vw] w-auto h-auto object-contain pointer-events-none select-none shadow-2xl"
                draggable={false}
              />
            </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 text-[10px] text-white/40 font-medium">
           滚轮缩放 • 拖拽平移 • 右键菜单已禁用
        </div>
      </DialogContent>
    </Dialog>
  )
}
