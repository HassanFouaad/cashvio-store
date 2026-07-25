import { PublicCategoryDto } from "@/features/categories/types/category.types";
import Image from "next/image";
import Link from "next/link";

interface CategoryTileProps {
  category: PublicCategoryDto;
}

/**
 * Large editorial category tile — wide imagery with a caption row below.
 * Used by the EDITORIAL_ROWS home composition (2-up feature tiles).
 */
export function CategoryTile({ category }: CategoryTileProps) {
  return (
    <Link href={`/categories/${category.id}`} className="group block">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover sf-img-zoom"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-semibold text-muted-foreground/40">
              {category.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <h3 className="mt-3 truncate text-base sm:text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
        {category.name}
      </h3>
    </Link>
  );
}
