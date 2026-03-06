import { ProductCard } from "@/features/products/components/product-card";
import { PublicProductDto } from "@/features/products/types/product.types";
import { ProductCardTranslations } from "@/features/products/utils";
import { getLocale, getTranslations } from "next-intl/server";

interface SpecialProductsSectionProps {
  products: PublicProductDto[];
  currency: string;
}

export async function SpecialProductsSection({
  products,
  currency,
}: SpecialProductsSectionProps) {
  const t = await getTranslations("store");
  const locale = await getLocale();

  const productTranslations: ProductCardTranslations = {
    noImageAvailable: t("products.noImageAvailable"),
    outOfStock: t("products.outOfStock"),
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
            {t("specialProducts.title")}
          </h2>
        </div>

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
