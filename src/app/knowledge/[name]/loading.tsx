import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function KnowledgeLoading() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      <header className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <div className="text-[10px] text-zinc-400 font-mono animate-pulse">Syncing with AI Global Knowledge Base...</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-white border-zinc-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
             <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[80%]" />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-zinc-900 border-none shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-3 w-20 bg-zinc-800" />
              <Skeleton className="h-10 w-16 bg-zinc-800" />
              <Skeleton className="h-1 bg-zinc-800 w-full" />
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200 shadow-sm">
             <CardHeader className="py-3">
               <Skeleton className="h-3 w-24" />
             </CardHeader>
             <CardContent className="space-y-3 pb-6">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
