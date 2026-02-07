import ReferenceUploadForm from "./ReferenceUploadForm";
import { ReferenceList } from "./ReferenceList";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReferencePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">难度基准库</h1>
        <p className="text-muted-foreground">
          上传厦门中考真题或质检卷，帮助 AI 更精准地判断题目难度。
        </p>
      </div>

      <ReferenceUploadForm />

      <div className="pt-8 border-t">
        <Suspense fallback={<ReferenceListSkeleton />}>
          <ReferenceList />
        </Suspense>
      </div>
    </div>
  );
}

function ReferenceListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
