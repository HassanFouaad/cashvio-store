import { Skeleton } from '@/components/ui/skeleton';

export function StoreLoading() {
  return (
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md shrink-0" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md shrink-0" />
          </div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <Skeleton className="w-full h-[400px] md:h-[500px]" />

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
