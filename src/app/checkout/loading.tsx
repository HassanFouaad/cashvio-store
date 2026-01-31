import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <section className="w-full max-w-full bg-muted/30 py-6 sm:py-8 md:py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <Skeleton className="h-9 w-48 mx-auto" />
            <Skeleton className="h-5 w-72 mx-auto" />
          </div>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Checkout Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fulfillment Method Skeleton */}
              <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Customer Info Skeleton */}
              <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
                <Skeleton className="h-6 w-44" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>

            {/* Order Summary - Right Column */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
