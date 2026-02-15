import { cn } from "@/lib/utils/cn";
import { Star } from "lucide-react";

interface StarRatingDisplayProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5",
  lg: "h-5.5 w-5.5",
};

/**
 * Star rating display component (server-safe, no interactivity)
 * For interactive star input, use StarRatingInput (client component)
 */
export function StarRatingDisplay({
  rating,
  maxStars = 5,
  size = "sm",
  className,
}: StarRatingDisplayProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}
