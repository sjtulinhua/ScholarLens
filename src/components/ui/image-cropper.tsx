"use client"

import React, { useState, useRef, useEffect } from 'react'
import ReactCrop, { 
  type Crop, 
  centerCrop, 
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from "@/components/ui/button"
import { Check, X, RotateCcw } from 'lucide-react'

// 辅助函数：居中裁剪
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedBlob: Blob) => void
  onCancel: () => void
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const [aspect, setAspect] = useState<number | undefined>(undefined)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    // 默认不做限制比例，让用户自由裁剪
    // setCrop(centerAspectCrop(width, height, 16 / 9))
    const initialCrop = centerCrop(
        makeAspectCrop(
            { unit: '%', width: 80 },
            1, // aspect placeholder
            width,
            height
        ),
        width,
        height
    )
    // Remove aspect from initial crop so it's free form
    delete (initialCrop as any).aspect
    setCrop(initialCrop)
  }

  const getCroppedImg = async () => {
    const image = imgRef.current
    const crop = completedCrop

    if (!image || !crop) {
      return
    }

    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    // 处理高分屏
    const pixelRatio = window.devicePixelRatio
    
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio)
    
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return
    }

    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = 'high'

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY
    
    const rotateRads = 0 // 暂不支持旋转
    const centerX = image.naturalWidth / 2
    const centerY = image.naturalHeight / 2

    ctx.save()

    // 移动原点到画布中心（如果支持旋转的话）
    // ctx.translate(-cropX, -cropY)
    ctx.translate(0, 0)
    
    ctx.drawImage(
      image,
      cropX,
      cropY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX, 
      crop.height * scaleY
    )

    ctx.restore()

    // 转换为 Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty')
        return
      }
      onCropComplete(blob)
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950/50 backdrop-blur-sm fixed inset-0 z-[60] p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col h-full max-h-[90vh] overflow-hidden w-full max-w-4xl mx-auto">
        <div className="p-4 border-b flex items-center justify-between bg-zinc-50">
          <h3 className="font-semibold text-lg">裁剪题目区域</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button size="sm" onClick={getCroppedImg} disabled={!completedCrop?.width || !completedCrop?.height}>
              <Check className="w-4 h-4 mr-1" />
              确认裁剪
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-900/5">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-h-full"
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              onLoad={onImageLoad}
              className="max-h-[70vh] w-auto object-contain shadow-lg"
            />
          </ReactCrop>
        </div>
        
        <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-50 border-t">
          拖动选框以截取题目，支持自由比例
        </div>
      </div>
    </div>
  )
}
