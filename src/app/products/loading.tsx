import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Page Header Skeleton */}
      <section className="w-full max-w-full bg-muted/30 py-8 sm:py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Skeleton className="h-8 sm:h-10 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <div className="flex justify-center pt-2">
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Products Skeleton */}
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
