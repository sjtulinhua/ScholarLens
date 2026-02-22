import { Skeleton } from "@/components/ui/skeleton";
import { MistakePageSkeleton } from "@/components/mistakes/MistakePageSkeleton";

// Assuming we need a skeleton component for the mistakes page
export default function MistakesLoading() {
  return (
    <div className="flex-1 flex flex-col p-6 max-h-screen overflow-hidden gap-6 bg-[#FBFBFB]">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-[200px] rounded-lg" />
        </div>
      </div>

      {/* Content Skeleton */}
      <MistakePageSkeleton />
    </div>
  );
}
