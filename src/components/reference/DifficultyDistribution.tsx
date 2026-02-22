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
    <div className="flex flex-col gap-3 p-4 bg-zinc-50/50 rounded-xl border border-zinc-100">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-zinc-700 uppercase tracking-widest font-mono">
          试卷难度分布 / Exam Profile
        </span>
      </div>

      {/* Visual Bar - Exam */}
      <div className="h-2 w-full flex rounded-full overflow-hidden bg-zinc-100 gap-[1px]">
        {(stats.easyPct ?? 0) > 0 && (
          <div 
            className="h-full bg-emerald-400 transition-all duration-500" 
            style={{ width: `${stats.easyPct}%` }} 
            title={`基础题: ${stats.easyPct}%`}
          />
        )}
        {(stats.medPct ?? 0) > 0 && (
          <div 
            className="h-full bg-blue-400 transition-all duration-500" 
            style={{ width: `${stats.medPct}%` }} 
            title={`中档题: ${stats.medPct}%`}
          />
        )}
        {(stats.hardPct ?? 0) > 0 && (
          <div 
            className="h-full bg-orange-500 transition-all duration-500" 
            style={{ width: `${stats.hardPct}%` }} 
            title={`压轴题: ${stats.hardPct}%`}
          />
        )}
      </div>

      {/* Visual Bar - User Mistakes (Comparison) */}
      {userStats && (
        <div className="mt-1">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
               我的错题画像 / My Errors
             </span>
          </div>
          <div className="h-2 w-full flex rounded-full overflow-hidden bg-zinc-100 gap-[1px] opacity-80">
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
