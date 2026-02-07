"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { History, Clock, ChevronRight } from "lucide-react"

interface Question {
  id: string
  subject: string
  knowledge_points: string[]
  created_at: string
}

export function HistoryDialog({ recentQuestions }: { recentQuestions: Question[] | null }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="bg-white border border-zinc-200 border-dashed cursor-pointer hover:bg-zinc-50 hover:border-zinc-300 transition-all group rounded-xl shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-zinc-200">
                <History className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-zinc-700 group-hover:text-zinc-900">查看历史记录</div>
                <div className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase group-hover:text-zinc-500">History Log</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[95vw] md:w-full bg-white border-zinc-200 shadow-xl rounded-xl text-zinc-900 mx-auto">
        <DialogHeader className="pb-4 border-b border-zinc-100">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
            <History className="w-5 h-5 text-zinc-500" />
            最近收录记录
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar pt-2">
          {recentQuestions && recentQuestions.length > 0 ? (
            recentQuestions.map((q) => (
              <div key={q.id} className="group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all cursor-default">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                    {q.knowledge_points[0] || "未分类知识点"}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded border border-zinc-200 font-mono uppercase tracking-tight group-hover:bg-white group-hover:shadow-sm">
                  {q.subject.toUpperCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-zinc-400 text-xs font-mono uppercase tracking-widest italic border border-dashed border-zinc-200 rounded-lg m-2">
              No Records Found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
