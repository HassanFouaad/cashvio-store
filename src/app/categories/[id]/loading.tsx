import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryDetailLoading() {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Category Header Skeleton */}
      <section className="w-full max-w-full bg-muted/30 py-8 sm:py-12 md:py-16">
        <div className="container">
          {/* Back Link Skeleton */}
          <Skeleton className="h-5 w-32 mb-6" />

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Category Image Skeleton */}
            <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 rounded-xl" />

            {/* Category Info Skeleton */}
            <div className="text-center md:text-start space-y-4 flex-1">
              <Skeleton className="h-8 sm:h-10 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
              <div className="flex justify-center md:justify-start pt-2">
                <Skeleton className="h-10 w-full max-w-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section Skeleton */}
      <section className="w-full max-w-full py-8 sm:py-12">
        <div className="container space-y-6">
          {/* Filter Bar Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Skeleton className="h-9 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-1.5">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
