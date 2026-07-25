import { ProductCard } from "@/features/products/components/product-card";
import { PublicProductDto } from "@/features/products/types/product.types";
import { ProductCardTranslations } from "@/features/products/utils";
import { getThemePersonality, resolveRequestTheme } from "@/lib/theme";
import { getLocale, getTranslations } from "next-intl/server";

/** How many products the SHOWCASE feature layout spotlights */
const FEATURE_PRODUCT_COUNT = 3;

interface SpecialProductsSectionProps {
  products: PublicProductDto[];
  currency: string;
  /**
   * Home-composition presentation: "grid" (default, density-driven),
   * "feature" (few oversized spotlight cards) or "strip" (compact
   * horizontal scroller).
   */
  presentation?: "grid" | "feature" | "strip";
}

export async function SpecialProductsSection({
  products,
  currency,
  presentation = "grid",
}: SpecialProductsSectionProps) {
  const t = await getTranslations("store");
  const locale = await getLocale();
  const resolvedTheme = await resolveRequestTheme();
  const personality = getThemePersonality(resolvedTheme.layout);

  const productTranslations: ProductCardTranslations = {
    noImageAvailable: t("products.noImageAvailable"),
    outOfStock: t("products.outOfStock"),
  };

  if (!products || products.length === 0) {
    return null;
  }

  const visibleProducts =
    presentation === "feature"
      ? products.slice(0, FEATURE_PRODUCT_COUNT)
      : products;

  const renderCard = (product: PublicProductDto) => (
    <ProductCard
      key={product.id}
      product={product}
      currency={currency}
      locale={locale}
      translations={productTranslations}
      variant={resolvedTheme.layout.productCard}
    />
  );

  return (
    <section className={`w-full max-w-full ${personality.section}`}>
      <div className="container">
        <div className={personality.headingWrapper}>
          <h2 className={personality.heading}>{t("specialProducts.title")}</h2>
        </div>

        {presentation === "feature" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {visibleProducts.map(renderCard)}
          </div>
        ) : presentation === "strip" ? (
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x scroll-smooth">
            {visibleProducts.map((product) => (
              <div
                key={product.id}
                className="w-[150px] sm:w-[170px] md:w-[190px] shrink-0 snap-start"
              >
                {renderCard(product)}
              </div>
            ))}
          </div>
        ) : (
          <div className={personality.homeGrid}>
            {visibleProducts.map(renderCard)}
          </div>
        )}
      </div>
    </section>
  );
}
