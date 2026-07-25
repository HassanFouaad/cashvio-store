import { CategoryCard } from '@/features/categories/components/category-card';
import { CategoryTile } from '@/features/categories/components/category-tile';
import { PublicCategoryDto } from '@/features/categories/types/category.types';
import { getThemePersonality, resolveRequestTheme } from '@/lib/theme';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

/** How many oversized tiles the EDITORIAL_ROWS presentation shows */
const TILE_CATEGORY_COUNT = 4;

interface CategoriesSectionProps {
  categories: PublicCategoryDto[];
  /**
   * Home-composition presentation: "strip" (default horizontal scroller),
   * "grid" (shop-by-aisle tile grid) or "tiles" (2-up editorial features).
   */
  presentation?: 'strip' | 'grid' | 'tiles';
}

export async function CategoriesSection({
  categories,
  presentation = 'strip',
}: CategoriesSectionProps) {
  const t = await getTranslations('store');
  const resolvedTheme = await resolveRequestTheme();
  const personality = getThemePersonality(resolvedTheme.layout);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className={`w-full max-w-full ${personality.section}`}>
      <div className="container">
        {/* Section Header - alignment/type follow the theme personality */}
        <div className={personality.headingWrapper}>
          <h2 className={personality.heading}>{t('categories.title')}</h2>
          <Link
            href="/categories"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            {t('categories.viewAll')}
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 shrink-0" />
          </Link>
        </div>

        {presentation === 'grid' ? (
          /* Shop-by-aisle grid (CATEGORY_FIRST home composition) */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : presentation === 'tiles' ? (
          /* Oversized editorial tiles (EDITORIAL_ROWS home composition) */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {categories.slice(0, TILE_CATEGORY_COUNT).map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        ) : (
          /* Horizontal Scrolling Categories - Enhanced for mobile native feel */
          <div className="relative -mx-3 sm:mx-0">
            <div className="overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth px-3 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="flex gap-3 sm:gap-4 md:gap-6 min-w-max px-0.5">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="w-[110px] sm:w-[150px] md:w-[180px] shrink-0 snap-start"
                  >
                    <CategoryCard category={category} />
                  </div>
                ))}
              </div>
            </div>

            {/* Fade overlays hinting at horizontal scroll (flip in RTL) */}
            <div className="pointer-events-none absolute top-0 start-0 h-full w-8 bg-gradient-to-r rtl:bg-gradient-to-l from-background to-transparent hidden sm:block" />
            <div className="pointer-events-none absolute top-0 end-0 h-full w-8 bg-gradient-to-l rtl:bg-gradient-to-r from-background to-transparent hidden sm:block" />
          </div>
        )}
      </div>
    </section>
  );
}
