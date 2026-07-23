import { CategoryCard } from '@/features/categories/components/category-card';
import { PublicCategoryDto } from '@/features/categories/types/category.types';
import { getSectionHeadingStyle, resolveRequestTheme } from '@/lib/theme';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface CategoriesSectionProps {
  categories: PublicCategoryDto[];
}

export async function CategoriesSection({
  categories,
}: CategoriesSectionProps) {
  const t = await getTranslations('store');
  const resolvedTheme = await resolveRequestTheme();
  const headingStyle = getSectionHeadingStyle(resolvedTheme.layout.header);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
      <div className="container">
        {/* Section Header - alignment follows the theme's header variant */}
        <div className={headingStyle.wrapper}>
          <h2 className={headingStyle.heading}>{t('categories.title')}</h2>
          <Link
            href="/categories"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            {t('categories.viewAll')}
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 shrink-0" />
          </Link>
        </div>

        {/* Horizontal Scrolling Categories - Enhanced for mobile native feel */}
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
      </div>
    </section>
  );
}
