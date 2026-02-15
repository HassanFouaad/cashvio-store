import { ProductReviewDto } from "@/features/products/types/product.types";
import { StarRatingDisplay } from "./star-rating";

interface ReviewCardProps {
  review: ProductReviewDto;
  dateLabel: string;
}

/**
 * Individual review card - Server component
 * Displays reviewer name, stars, comment, and relative date
 */
export function ReviewCard({ review, dateLabel }: ReviewCardProps) {
  const reviewDate = new Date(review.createdAt);
  const formattedDate = reviewDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border-b border-border pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {review.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {review.name}
              </p>
              <StarRatingDisplay rating={review.stars} size="sm" />
            </div>
          </div>
        </div>
        <time
          dateTime={review.createdAt}
          className="text-xs text-muted-foreground shrink-0"
        >
          {formattedDate}
        </time>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {review.comment}
      </p>
    </div>
  );
}
