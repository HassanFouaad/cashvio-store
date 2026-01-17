import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { CategoryCard } from '@/features/categories/components/category-card';
import { PublicCategoryDto } from '@/features/categories/types/category.types';

interface CategoriesSectionProps {
  categories: PublicCategoryDto[];
  storeCode: string;
}

export async function CategoriesSection({
  categories,
  storeCode,
}: CategoriesSectionProps) {
  const t = await getTranslations('store');

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {t('categories.title')}
          </h2>
          <Link
            href={`/store/${storeCode}/categories`}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            {t('categories.viewAll')}
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 shrink-0" />
          </Link>
        </div>

        {/* Horizontal Scrolling Categories */}
        <div className="relative">
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-3 sm:gap-4 md:gap-6 min-w-max px-0.5">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="w-[120px] sm:w-[150px] md:w-[180px] shrink-0"
                >
                  <CategoryCard category={category} storeCode={storeCode} />
                </div>
              ))}
            </div>
          </div>

          {/* Fade Gradients for Scroll Indication */}
          <div className="pointer-events-none absolute top-0 start-0 h-full w-8 bg-gradient-to-e from-background to-transparent" />
          <div className="pointer-events-none absolute top-0 end-0 h-full w-8 bg-gradient-to-s from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}
