import { BrainCircuit } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
            <BrainCircuit className="w-10 h-10" />
          </div>
          <div className="absolute -inset-4 border border-zinc-200 rounded-[2rem] animate-[spin_4s_linear_infinite] pointer-events-none"></div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-zinc-900 font-bold tracking-tight"> ScholarLens </p>
          <p className="text-zinc-400 text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">Initializing Systems...</p>
        </div>
      </div>
    </div>
  )
}
