"use client"

"use client"

import { useMemo } from "react";

interface DifficultyDistributionProps {
  questions: { difficulty: number }[];
  userMistakes?: { difficulty: number }[];
}

export function DifficultyDistribution({ questions, userMistakes }: DifficultyDistributionProps) {
  const stats = useMemo(() => {
    const total = questions.length;
    if (total === 0) return { easy: 0, med: 0, hard: 0 };

    let easy = 0; // 难度 1-2
    let med = 0;  // 难度 3
    let hard = 0; // 难度 4-5

    questions.forEach(q => {
      if (q.difficulty <= 2) easy++;
      else if (q.difficulty === 3) med++;
      else hard++;
    });

    return {
      easyPct: Math.round((easy / total) * 100),
      medPct: Math.round((med / total) * 100),
      hardPct: Math.round((hard / total) * 100),
      easyCount: easy,
      medCount: med,
      hardCount: hard,
      total
    };
  }, [questions]);

  // Calculate stats for user mistakes if provided
  const userStats = useMemo(() => {
    if (!userMistakes || userMistakes.length === 0) return null;
    
    const total = userMistakes.length;
    let easy = 0, med = 0, hard = 0;
    
    userMistakes.forEach(q => {
      if (q.difficulty <= 2) easy++;
      else if (q.difficulty === 3) med++;
      else hard++;
    });

    return {
      easyPct: Math.round((easy / total) * 100),
      medPct: Math.round((med / total) * 100),
      hardPct: Math.round((hard / total) * 100),
      total
    };
  }, [userMistakes]);

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-50/50 rounded-xl border border-zinc-100">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
          试卷难度分布 / EXAM PROFILE
        </span>
        <span className="text-[10px] font-medium text-zinc-400 font-mono">
          TOTAL: {stats.total}
        </span>
      </div>

      {/* Visual Bar - Exam */}
      <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-zinc-100 gap-[1px]">
        {(stats.easyPct ?? 0) > 0 && (
          <div 
            className="h-full bg-emerald-400 transition-all duration-500" 
            style={{ width: `${stats.easyPct}%` }} 
          />
        )}
        {(stats.medPct ?? 0) > 0 && (
          <div 
            className="h-full bg-blue-400 transition-all duration-500" 
            style={{ width: `${stats.medPct}%` }} 
          />
        )}
        {(stats.hardPct ?? 0) > 0 && (
          <div 
            className="h-full bg-orange-500 transition-all duration-500" 
            style={{ width: `${stats.hardPct}%` }} 
          />
        )}
      </div>

      {/* Detailed Stats Legend */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-400 uppercase font-mono leading-none">Easy</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-emerald-600 font-mono">{stats.easyCount}</span>
            <span className="text-xs font-medium text-amber-600 font-mono">{stats.easyPct}%</span>
          </div>
        </div>
        <div className="flex flex-col border-x border-zinc-100 px-2">
          <span className="text-[9px] text-zinc-400 uppercase font-mono leading-none">Medium</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-blue-600 font-mono">{stats.medCount}</span>
            <span className="text-xs font-medium text-amber-600 font-mono">{stats.medPct}%</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-zinc-400 uppercase font-mono leading-none">Hard</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-orange-600 font-mono">{stats.hardCount}</span>
            <span className="text-xs font-medium text-amber-600 font-mono">{stats.hardPct}%</span>
          </div>
        </div>
      </div>

      {/* Visual Bar - User Mistakes (Comparison) - Integrated more subtly if present */}
      {userStats && (
        <div className="mt-2 pt-2 border-t border-zinc-100/80">
          <div className="flex justify-between items-center mb-1.5">
             <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
               错题画像 / MY ERRORS
             </span>
             <span className="text-[9px] font-mono text-zinc-300">N={userStats.total}</span>
          </div>
          <div className="h-1 w-full flex rounded-full overflow-hidden bg-zinc-100 gap-[1px] opacity-70">
            {(userStats.easyPct ?? 0) > 0 && (
              <div 
                className="h-full bg-emerald-400/80 transition-all duration-500" 
                style={{ width: `${userStats.easyPct}%` }} 
              />
            )}
            {(userStats.medPct ?? 0) > 0 && (
              <div 
                className="h-full bg-blue-400/80 transition-all duration-500" 
                style={{ width: `${userStats.medPct}%` }} 
              />
            )}
            {(userStats.hardPct ?? 0) > 0 && (
              <div 
                className="h-full bg-orange-500/80 transition-all duration-500" 
                style={{ width: `${userStats.hardPct}%` }} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
