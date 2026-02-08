
import { memo, useMemo } from "react"
import { MistakeCard, MistakeCardProps } from "./MistakeCard"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatKnowledgePoint } from "@/lib/format"
import { Layers } from "lucide-react"

interface MistakeGroupedViewProps extends Omit<MistakeCardProps, 'm'> {
  mistakes: any[]
}

export const MistakeGroupedView = memo(({
  mistakes,
  ...cardProps
}: MistakeGroupedViewProps) => {
  
  // Group mistakes by first knowledge point
  const groupedMistakes = useMemo(() => {
    const groups: Record<string, any[]> = {}
    
    mistakes.forEach(m => {
      const kp = m.question.knowledge_points?.[0] || "未分类"
      if (!groups[kp]) {
        groups[kp] = []
      }
      groups[kp].push(m)
    })
    
    // Sort groups by key (maybe alphabetical or custom order)
    return Object.entries(groups).sort((a, b) => {
        // 1. "未分类" always last
        if (a[0] === "未分类") return 1
        if (b[0] === "未分类") return -1
        
        // 2. Sort by count (descending)
        const countDiff = b[1].length - a[1].length
        if (countDiff !== 0) return countDiff

        // 3. Sort by name (A-Z)
        return a[0].localeCompare(b[0], 'zh-CN')
    })
  }, [mistakes])

  return (
    <Accordion type="multiple" className="w-full space-y-4" defaultValue={groupedMistakes.map(g => g[0])}>
      {groupedMistakes.map(([kp, groupMistakes]) => (
        <AccordionItem key={kp} value={kp} className="border border-primary/10 rounded-xl bg-white/50 backdrop-blur-sm overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg text-primary">
                    <Layers className="w-4 h-4" />
                </div>
                <div className="text-left">
                    <div className="font-bold text-base text-zinc-900">
                        {formatKnowledgePoint(kp)}
                    </div>
                    <div className="text-xs text-muted-foreground font-normal">
                        共 {groupMistakes.length} 题
                    </div>
                </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupMistakes.map(m => (
                    <MistakeCard 
                        key={m.id} 
                        m={m} 
                        {...cardProps} 
                    />
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
})

MistakeGroupedView.displayName = "MistakeGroupedView"
