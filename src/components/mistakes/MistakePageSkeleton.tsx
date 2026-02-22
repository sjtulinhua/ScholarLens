import { Skeleton } from "@/components/ui/skeleton";

export function MistakePageSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
      {/* Sidebar Skeleton (Subject List) */}
      <div className="w-full md:w-48 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg shrink-0" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col overflow-hidden">
        {/* Toolbar Skeleton */}
        <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Grid View Skeleton */}
        <div className="p-6 overflow-y-auto flex-1 h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border border-zinc-100 p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
