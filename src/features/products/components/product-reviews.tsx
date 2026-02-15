import { getProductReviewsWithErrorHandling } from "@/features/products/api/get-product-reviews";
import { getTranslations } from "next-intl/server";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import { StarRatingDisplay } from "./star-rating";

interface ProductReviewsProps {
  productId: string;
  storeId: string;
}

/**
 * Product reviews section - Server Component
 * Fetches and displays approved reviews + review submission form
 */
export async function ProductReviews({
  productId,
  storeId,
}: ProductReviewsProps) {
  const t = await getTranslations("store.products");

  const { reviews } = await getProductReviewsWithErrorHandling(productId);

  const reviewItems = reviews?.items ?? [];
  const totalReviews = reviews?.pagination?.totalItems ?? 0;

  // Calculate average rating
  const averageRating =
    reviewItems.length > 0
      ? Math.round(
          (reviewItems.reduce((sum, r) => sum + r.stars, 0) /
            reviewItems.length) *
            10
        ) / 10
      : 0;

  return (
    <section className="mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-border">
      <div className="max-w-3xl">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              {t("customerReviews")}
            </h2>
            {totalReviews > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <StarRatingDisplay rating={Math.round(averageRating)} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {averageRating} {t("outOf")} 5 ({totalReviews}{" "}
                  {totalReviews === 1 ? t("review") : t("reviewsCount")})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        {reviewItems.length > 0 ? (
          <div className="space-y-5 mb-8">
            {reviewItems.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                dateLabel={t("reviewDate")}
              />
            ))}
          </div>
        ) : (
          <div className="mb-8 rounded-lg border border-border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
          </div>
        )}

        {/* Review Form */}
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <ReviewForm productId={productId} />
        </div>
      </div>
    </section>
  );
}
