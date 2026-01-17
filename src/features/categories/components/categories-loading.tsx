import { Skeleton } from '@/components/ui/skeleton';

export function CategoriesLoading() {
  return (
    <div className="w-full max-w-full">
      {/* Header Skeleton */}
      <div className="bg-muted/30 py-8 sm:py-12 md:py-16 mb-8 sm:mb-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mx-auto" />
            <Skeleton className="h-4 sm:h-5 w-full max-w-md mx-auto" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
