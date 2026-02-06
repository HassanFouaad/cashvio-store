import { Skeleton } from "@/components/ui/skeleton";

export default function StaticPageLoading() {
  return (
    <div className="w-full max-w-full overflow-x-hidden py-6 sm:py-8">
      <div className="container max-w-4xl mx-auto">
        {/* Back link skeleton */}
        <Skeleton className="h-5 w-32 mb-6" />

        {/* Page content skeleton */}
        <div className="space-y-6">
          {/* Title skeleton */}
          <Skeleton className="h-8 sm:h-10 w-3/4" />

          {/* Content skeleton - multiple paragraphs */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
