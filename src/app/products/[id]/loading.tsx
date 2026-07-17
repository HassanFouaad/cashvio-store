import { Skeleton } from "@/components/ui/skeleton";

/**
 * Product detail skeleton — mirrors the gallery + info two-column layout.
 */
export default function ProductLoading() {
  return (
    <div className="w-full max-w-full overflow-x-hidden py-4 sm:py-6 lg:py-8">
      <div className="container">
        {/* Breadcrumb */}
        <Skeleton className="h-4 w-48 mb-4 sm:mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Info column */}
          <div className="lg:col-span-5 space-y-5">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
