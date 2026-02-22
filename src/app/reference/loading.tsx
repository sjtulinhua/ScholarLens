import { Skeleton } from "@/components/ui/skeleton";
import { ReferencePageSkeleton } from "@/components/reference/ReferencePageSkeleton";

export default function ReferenceLoading() {
  return (
    <div className="flex-1 flex flex-col p-6 max-h-screen overflow-hidden gap-6 bg-[#FBFBFB]">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
           <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Content Skeleton */}
      <ReferencePageSkeleton />
    </div>
  );
}
