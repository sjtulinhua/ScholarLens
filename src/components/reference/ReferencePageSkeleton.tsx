import { Skeleton } from "@/components/ui/skeleton";

export function ReferencePageSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex flex-col gap-2">
           <Skeleton className="h-8 w-24 mb-2" />
           {[1, 2, 3, 4].map((i) => (
             <Skeleton key={i} className="h-10 w-full rounded-lg" />
           ))}
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col overflow-hidden">
        {/* Toolbar Skeleton */}
        <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <Skeleton className="h-8 w-64 rounded-lg" />
           <Skeleton className="h-8 w-32 rounded-lg" />
        </div>

        {/* List View Skeleton */}
        <div className="p-6 overflow-y-auto flex-1 h-full flex flex-col gap-4">
           {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-3 rounded-xl border border-zinc-100 p-6 shadow-sm">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
