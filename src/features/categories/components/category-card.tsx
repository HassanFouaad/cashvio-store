import { PublicCategoryDto } from "@/features/categories/types/category.types";
import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  category: PublicCategoryDto;
}

/**
 * Category card component for grid display
 * Enhanced for native mobile touch interactions
 */
export function CategoryCard({ category }: CategoryCardProps) {
  const hasImage = category.imageUrl;

  return (
    <Link 
      href={`/categories/${category.id}`} 
      className="group block w-full touch-manipulation active:scale-[0.97] transition-transform duration-150"
    >
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Category Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted shadow-sm">
          {hasImage ? (
            <Image
              src={category.imageUrl!}
              alt={category.name}
              fill
              sizes="(max-width: 640px) 120px, (max-width: 1024px) 150px, 180px"
              className="object-cover transition-transform duration-300 group-hover:scale-110 group-active:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <span className="text-3xl sm:text-4xl font-bold text-muted-foreground/40">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Hover/Active Overlay */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10 group-active:bg-black/15" />
        </div>

        {/* Category Name */}
        <h3 className="text-xs sm:text-sm font-medium text-center truncate px-1 group-hover:text-primary group-active:text-primary transition-colors">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}
