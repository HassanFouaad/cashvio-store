import { getCategoriesWithErrorHandling } from "@/features/categories/api/get-categories";
import { CategoriesSection } from "@/features/categories/components/categories-section";
import { getProductsWithErrorHandling } from "@/features/products/api/get-products";
import { ProductsSection } from "@/features/products/components/products-section";
import { getStoreWithErrorHandling } from "@/features/store/api/get-store";
import { StoreEmptyState } from "@/features/store/components/store-empty-state";
import { StoreErrorComponent } from "@/features/store/components/store-error";
import { StoreHero } from "@/features/store/components/store-hero";
import { StoreErrorType } from "@/features/store/types/store.types";
import { getStoreSubdomain } from "@/features/store/utils/store-resolver";
import { TrackViewItemList } from "@/lib/analytics/track-event";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export default async function HomePage() {
  // Get store subdomain from subdomain
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const storeSubdomain = getStoreSubdomain(hostname);

  // No store subdomain = no subdomain = show error
  if (!storeSubdomain) {
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
  const { store, error } = await getStoreWithErrorHandling(storeSubdomain);

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

  // Check if store is empty (no products and no categories)
  const isStoreEmpty = categories.length === 0 && products.length === 0;

  // If store is empty, show empty state
  if (isStoreEmpty) {
    return (
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Hero Section (if has images) */}
        {heroImages.length > 0 && (
          <StoreHero heroImages={heroImages} storeName={store.name} />
        )}

        {/* Empty State */}
        <StoreEmptyState storeName={store.name} />
      </div>
    );
  }

  // Prepare analytics items for homepage view_item_list
  const analyticsItems = products.map((p) => ({
    item_id: p.id,
    item_name: p.name,
    price: p.variants?.[0]?.sellingPrice ?? 0,
    quantity: 1,
  }));

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {products.length > 0 && (
        <TrackViewItemList
          listId="homepage-products"
          listName="Homepage Products"
          items={analyticsItems}
        />
      )}

      {/* Hero Section */}
      <StoreHero heroImages={heroImages} storeName={store.name} />

      {/* Categories Section */}
      <CategoriesSection categories={categories} />

      {/* Products Section */}
      <ProductsSection products={products} currency={store.currency} />
    </div>
  );
}
