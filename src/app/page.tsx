import { getCategoriesWithErrorHandling } from "@/features/categories/api/get-categories";
import { CategoriesSection } from "@/features/categories/components/categories-section";
import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductsSection } from "@/features/products/components/products-section";
import { getStoreWithErrorHandling } from "@/features/store/api/get-store";
import { StoreErrorComponent } from "@/features/store/components/store-error";
import { StoreHero } from "@/features/store/components/store-hero";
import { StoreErrorType } from "@/features/store/types/store.types";
import { getStoreCode } from "@/features/store/utils/store-resolver";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export default async function HomePage() {
  // Get store code from subdomain
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeCode = getStoreCode(hostname);

  // No store code = no subdomain = show error
  if (!storeCode) {
    return (
      <StoreErrorComponent
        error={{
          type: StoreErrorType.NOT_FOUND,
          message: "No store subdomain found",
        }}
      />
    );
  }

  // Render store homepage with error handling
  const { store, error } = await getStoreWithErrorHandling(storeCode);

  // Handle store errors
  if (error || !store) {
    return (
      <StoreErrorComponent
        error={
          error || { type: StoreErrorType.UNKNOWN, message: "Store not found" }
        }
      />
    );
  }

  const t = await getTranslations();

  const heroImages = store.storeFront?.heroImages || [];

  // Fetch first 7 categories
  const { categories: categoriesData } = await getCategoriesWithErrorHandling({
    tenantId: store.tenantId,
    page: 1,
    limit: 7,
  });

  // Fetch first 12 products
  const { products: productsData } = await getProductsWithErrorHandling({
    storeId: store.id,
    tenantId: store.tenantId,
    page: 1,
    limit: 12,
  });

  const categories = categoriesData?.items || [];
  const products = productsData?.items || [];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Hero Section */}
      <StoreHero heroImages={heroImages} storeName={store.name} />

      {/* Categories Section */}
      <CategoriesSection categories={categories} />

      {/* Products Section */}
      <ProductsSection products={products} currency={store.currency} />

      {/* Features Section */}
      <section className="w-full max-w-full bg-muted/50 py-6 sm:py-10 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 w-full">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground font-bold text-base sm:text-lg mb-2">
                1
              </div>
              <h3 className="text-base sm:text-lg font-semibold px-2">
                {t("features.quality.title")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
                {t("features.quality.description")}
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground font-bold text-base sm:text-lg mb-2">
                2
              </div>
              <h3 className="text-base sm:text-lg font-semibold px-2">
                {t("features.delivery.title")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
                {t("features.delivery.description")}
              </p>
            </div>
            <div className="text-center space-y-2 sm:col-span-2 md:col-span-1">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground font-bold text-base sm:text-lg mb-2">
                3
              </div>
              <h3 className="text-base sm:text-lg font-semibold px-2">
                {t("features.support.title")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
                {t("features.support.description")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
