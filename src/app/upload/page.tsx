"use client"

import { useState, useRef, useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { processMistake, type UploadState } from "./actions"
import { useRouter } from "next/navigation"

const initialState: UploadState = {}

export default function UploadPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [subject, setSubject] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [state, formAction, isPending] = useActionState(processMistake, initialState)

  // 处理成功跳转
  useEffect(() => {
    if (state.success) {
      // 延迟跳转，让用户看到成功状态
      const timer = setTimeout(() => {
        router.push("/")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state.success, router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("图片大小不能超过 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (state.success) {
    return (
      <div className="container max-w-2xl py-24 text-center space-y-6">
        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">分析完成！</h1>
          <p className="text-muted-foreground text-lg">AI 已成功识别题目并诊断知识点</p>
        </div>
        <p className="text-sm text-muted-foreground">正在引导您返回首页查看分析结果...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-zinc-200">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl font-bold">上传错题</h1>
          <p className="text-muted-foreground">
            拍照或上传试卷图片，AI 将自动分析并归类知识点
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject-select">选择科目</Label>
              <Select name="subject" onValueChange={setSubject} value={subject} required>
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="请选择科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">数学</SelectItem>
                  <SelectItem value="chinese">语文</SelectItem>
                  <SelectItem value="physics">物理</SelectItem>
                  <SelectItem value="chemistry">化学</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>错题图片</Label>
              {!selectedImage ? (
                <Card 
                  className="border-2 border-dashed h-80 flex items-center justify-center cursor-pointer hover:border-primary transition-colors hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <CardContent className="flex flex-col items-center space-y-4 text-muted-foreground">
                    <div className="p-4 rounded-full bg-muted">
                      <Upload className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-lg">点击上传或拖拽图片到这里</p>
                      <p className="text-sm underline">支持 JPG, PNG (最大 5MB)</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-black/5 aspect-[4/3]">
                  <Button 
                    type="button"
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-4 right-4 h-10 w-10 z-10 shadow-lg rounded-full"
                    onClick={clearImage}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  <Image 
                    src={selectedImage} 
                    alt="Preview" 
                    fill 
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>
              )}
              <input 
                name="image"
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                required
                onChange={handleFileSelect}
              />
            </div>

            {state.error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm font-medium">
                {state.error}
              </div>
            )}

            <Button 
              type="submit"
              className="w-full h-12 text-lg font-semibold" 
              disabled={!selectedImage || !subject || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  AI 正在阅读题目并分析中...
                </>
              ) : (
                "开始智能分析"
              )}
            </Button>
          </div>
        </form>

        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400">
          <p className="font-semibold mb-1 italic text-blue-300">💡 提示：</p>
          <p>理科题目采用 Gemini 1.5 Pro 进行深度分析，文科题目侧重知识点与错因诊断。</p>
        </div>
      </div>
    </div>
  )
}

