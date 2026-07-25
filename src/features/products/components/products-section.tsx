import { ProductCard } from "@/features/products/components/product-card";
import { PublicProductDto } from "@/features/products/types/product.types";
import { ProductCardTranslations } from "@/features/products/utils";
import { getThemePersonality, resolveRequestTheme } from "@/lib/theme";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

interface ProductsSectionProps {
  products: PublicProductDto[];
  currency: string;
}

export async function ProductsSection({
  products,
  currency,
}: ProductsSectionProps) {
  const t = await getTranslations("store");
  const locale = await getLocale();
  const resolvedTheme = await resolveRequestTheme();
  const personality = getThemePersonality(resolvedTheme.layout);

  // Get translations for ProductCard
  const productTranslations: ProductCardTranslations = {
    noImageAvailable: t("products.noImageAvailable"),
    outOfStock: t("products.outOfStock"),
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={`w-full max-w-full ${personality.section}`}>
      <div className="container">
        {/* Section Header - alignment/type follow the theme personality */}
        <div className={personality.headingWrapper}>
          <h2 className={personality.heading}>{t("products.title")}</h2>
          <Link
            href="/products"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            {t("products.viewAll")}
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 shrink-0" />
          </Link>
        </div>

        {/* Products Grid - density follows the theme personality */}
        <div className={personality.homeGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              locale={locale}
              translations={productTranslations}
              variant={resolvedTheme.layout.productCard}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
