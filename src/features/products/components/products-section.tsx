import { ProductCard } from "@/features/products/components/product-card";
import { PublicProductDto } from "@/features/products/types/product.types";
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

  // Get translations for ProductCard
  const productTranslations = {
    noImageAvailable: t("products.noImageAvailable"),
    outOfStock: t("products.outOfStock"),
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {t("products.title")}
          </h2>
          <Link
            href="/products"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            {t("products.viewAll")}
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 shrink-0" />
          </Link>
        </div>

        {/* Products Grid - 2 rows of 6 on desktop, responsive on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              locale={locale}
              translations={productTranslations}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
