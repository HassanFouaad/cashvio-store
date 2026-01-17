import Image from 'next/image';
import Link from 'next/link';
import { PublicCategoryDto } from '@/features/categories/types/category.types';

interface CategoryCardProps {
  category: PublicCategoryDto;
  storeCode: string;
}

export function CategoryCard({ category, storeCode }: CategoryCardProps) {
  const hasImage = category.imageUrl;

  return (
    <Link
      href={`/store/${storeCode}/categories/${category.id}`}
      className="group block w-full"
    >
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Category Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          {hasImage ? (
            <Image
              src={category.imageUrl!}
              alt={category.name}
              fill
              sizes="(max-width: 640px) 120px, (max-width: 1024px) 150px, 180px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <span className="text-3xl sm:text-4xl font-bold text-muted-foreground/40">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        </div>

        {/* Category Name */}
        <h3 className="text-xs sm:text-sm font-medium text-center truncate px-1 group-hover:text-primary transition-colors">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}
