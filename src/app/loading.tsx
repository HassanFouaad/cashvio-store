import { Skeleton } from "@/components/ui/skeleton";

/**
 * Home page skeleton — mirrors StoreHero + sections geometry so the
 * transition to real content is jump-free.
 */
export default function HomeLoading() {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero skeleton */}
      <Skeleton className="w-full h-[250px] sm:h-[350px] md:h-[450px] rounded-none" />

      {/* Categories row skeleton */}
      <section className="w-full py-8 sm:py-10">
        <div className="container space-y-5">
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 space-y-2">
                <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid skeleton */}
      <section className="w-full py-8 sm:py-10">
        <div className="container space-y-5">
          <Skeleton className="h-7 w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
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
