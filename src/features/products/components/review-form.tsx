"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitProductReview } from "@/features/products/api/submit-product-review";
import { cn } from "@/lib/utils/cn";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReviewFormProps {
  productId: string;
}

/**
 * Review submission form - Client Component
 * Handles star rating input, name, comment, and submits via server action
 */
export function ReviewForm({ productId }: ReviewFormProps) {
  const t = useTranslations("store.products");
  const router = useRouter();

  const [name, setName] = useState("");
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (stars === 0) {
      setError(t("ratingRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitProductReview(productId, {
        name,
        stars,
        comment,
      });

      if (result.success) {
        setSubmitted(true);
        setName("");
        setStars(0);
        setComment("");
        router.refresh();
      } else {
        setError(result.error || t("reviewSubmitError"));
      }
    } catch {
      setError(t("reviewSubmitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {t("reviewSubmitted")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("reviewPending")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setSubmitted(false)}
        >
          {t("writeAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-medium text-foreground">
        {t("writeReview")}
      </h3>

      {/* Star Rating Input */}
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">
          {t("yourRating")}
        </label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setStars(starValue)}
                onMouseEnter={() => setHoveredStar(starValue)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    starValue <= (hoveredStar || stars)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted-foreground/40"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Name Input */}
      <div className="space-y-1.5">
        <label htmlFor="review-name" className="text-sm text-muted-foreground">
          {t("reviewerName")}
        </label>
        <Input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("reviewerNamePlaceholder")}
          required
          maxLength={255}
        />
      </div>

      {/* Comment Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="review-comment"
          className="text-sm text-muted-foreground"
        >
          {t("yourComment")}
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
          required
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting || stars === 0}>
        {isSubmitting ? t("submitting") : t("submitReview")}
      </Button>
    </form>
  );
}
