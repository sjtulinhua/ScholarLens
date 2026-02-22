"use client"

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

export type WeaknessData = {
  name: string;
  total: number;
  corrected: number;
};

interface TopWeaknessListProps {
  data: WeaknessData[];
  totalGlobalMistakes?: number; // Added to enable global proportional scaling if needed
}

export function TopWeaknessList({ data, totalGlobalMistakes }: TopWeaknessListProps) {
  const sortedData = useMemo(() => {
    return [...data]
      .map(item => ({ ...item, activeCount: item.total - item.corrected }))
      .filter(item => item.total > 0)
      .sort((a, b) => {
        // Priority 1: Highest remaining active mistakes
        if (b.activeCount !== a.activeCount) {
          return b.activeCount - a.activeCount; 
        }
        // Priority 2: Highest total mistakes
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        // Priority 3: Lowest corrected ratio
        const aRatio = a.total > 0 ? a.corrected / a.total : 0;
        const bRatio = b.total > 0 ? b.corrected / b.total : 0;
        return aRatio - bRatio;
      })
      .slice(0, 8); // Top 8 weaknesses
  }, [data]);

  if (sortedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
        <ShieldAlert className="w-8 h-8 text-zinc-300" />
        <p className="text-sm">暂无错题数据，开始录入发现薄弱项吧</p>
      </div>
    );
  }

  // Find max active count for fallback scaling
  const maxActiveInList = Math.max(...sortedData.map(d => d.activeCount), 1);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col gap-5 w-full">
      {sortedData.map((item, index) => {
        const isMastered = item.corrected === item.total && item.total > 0;
        const activeCount = item.total - item.corrected;
        // Knowledge point names are already cleaned at the data source level
        const displayName = item.name;
        
        const percentage = totalGlobalMistakes 
          ? (activeCount / totalGlobalMistakes) * 100 
          : (activeCount / maxActiveInList) * 100;
          
        return (
          <Tooltip key={item.name}>
            <TooltipTrigger asChild>
              <Link 
                href={`/mistakes?knowledge_point=${encodeURIComponent(displayName)}`}
                className="flex flex-col gap-2 group/item p-2 -mx-2 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-800 tracking-tight group-hover/item:text-amber-600 transition-colors">
                      <span className="text-zinc-400 font-mono mr-1.5">{index + 1}.</span>
                      {displayName}
                    </span>
                    {isMastered ? (
                      <Badge variant="outline" className="px-1.5 h-4 text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 leading-none">
                        已攻克
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="px-1.5 h-4 text-[10px] text-orange-600 border-orange-200 bg-orange-50 leading-none">
                        待突破
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-zinc-200"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500 transition-all duration-1000"
                          strokeDasharray={`${(item.corrected / item.total) * 100}, 100`}
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className={item.corrected > 0 ? "text-emerald-600 font-bold" : "text-zinc-400"}>
                        {item.corrected}
                      </span>
                      <span className="mx-1 text-zinc-300">/</span>
                      <span>{item.total}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 w-full">
                  {/* Primary Bar: Color bar represents relative frequency of remaining ACTIVE mistakes. */}
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isMastered ? 'bg-emerald-500' : 'bg-orange-400'}`} 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-zinc-900 text-zinc-50 border-zinc-800 shadow-xl ml-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">占剩余未解决错题</span>
                <span className="text-lg font-bold text-amber-500 font-mono tracking-tighter">
                  {isMastered ? 0 : Math.round(percentage)}%
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
    </TooltipProvider>
  );
}
