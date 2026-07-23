import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductCard } from "@/features/products/components/product-card";
import {
  RELATED_PRODUCTS_FETCH_LIMIT,
  RELATED_PRODUCTS_LIMIT,
} from "@/features/products/constants/related-products";
import { ProductCardTranslations } from "@/features/products/utils";
import { LayoutGrid } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

interface RelatedProductsSectionProps {
  storeId: string;
  tenantId: string;
  categoryId: string;
  currentProductId: string;
  currency: string;
}

/**
 * Same-category product strip on the PDP. No ML — just other products in
 * the same category, excluding the product being viewed.
 */
export async function RelatedProductsSection({
  storeId,
  tenantId,
  categoryId,
  currentProductId,
  currency,
}: RelatedProductsSectionProps) {
  const t = await getTranslations("store.relatedProducts");
  const tProducts = await getTranslations("store.products");
  const locale = await getLocale();

  const { products } = await getProductsWithErrorHandling({
    storeId,
    tenantId,
    categoryId,
    page: 1,
    limit: RELATED_PRODUCTS_FETCH_LIMIT,
  });

  const related =
    products?.items
      .filter((product) => product.id !== currentProductId)
      .slice(0, RELATED_PRODUCTS_LIMIT) ?? [];

  if (related.length === 0) {
    return null;
  }

  const productTranslations: ProductCardTranslations = {
    noImageAvailable: tProducts("noImageAvailable"),
    outOfStock: tProducts("outOfStock"),
  };

  return (
    <section className="w-full space-y-4 py-6 sm:py-8">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg sm:text-xl font-semibold">{t("title")}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            locale={locale}
            translations={productTranslations}
          />
        ))}
      </div>
    </section>
  );
}
