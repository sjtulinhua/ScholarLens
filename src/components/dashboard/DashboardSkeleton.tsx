import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-4">
      {/* Left Column Skeleton */}
      <div className="md:col-span-1 lg:col-span-8 flex flex-col gap-6 lg:gap-8 order-2 md:order-1 lg:order-1">
        <Card className="flex-1 min-h-[400px] md:min-h-[500px] border-zinc-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 space-y-2">
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="flex items-center justify-center pt-6">
            <Skeleton className="h-[300px] w-[300px] rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* Right Column Skeleton */}
      <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-6 order-1 md:order-2 lg:order-2">
        <Card className="border-zinc-200 shadow-sm rounded-xl p-8 h-[220px] justify-between flex flex-col">
           <div className="space-y-3">
             <Skeleton className="h-3 w-24" />
             <Skeleton className="h-12 w-16" />
           </div>
           <div className="space-y-3">
             <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-10" />
             </div>
             <Skeleton className="h-1.5 w-full rounded-full" />
           </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
           <Skeleton className="aspect-square rounded-xl" />
           <Skeleton className="aspect-square rounded-xl" />
        </div>

        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  )
}
