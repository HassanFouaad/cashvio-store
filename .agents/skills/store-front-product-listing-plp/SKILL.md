---
name: store-front-product-listing-plp
description: Product Listing Pages (PLP), category filters, URL search synchronization, sorting, and pagination
---

# Product Listing Pages (PLP) & Search Catalog

How to build and maintain the Product Listing Page (PLP), category listing pages (`/categories/[id]`), URL search parameter synchronization, sorting, and responsive product grids.

## When to Use
- Implementing or modifying `/products/page.tsx` or `/categories/[id]/page.tsx`.
- Adding search, category filtering, or sorting to product grids.
- Handling URL search parameter synchronization (`?search=`, `?sortBy=`, `?inStock=`, `?categoryId=`).
- Managing responsive product card layouts and skeleton loading states.

## Core Rules & Invariants
1. **URL-Driven Filters**: All filters (search query, category ID, sort criteria, page) must sync with URL `searchParams` for shareability and SSR compatibility.
2. **Safe Sort Options**: Use `ProductSortBy` enum values (`CREATED_AT_DESC`, `PRICE_ASC`, `PRICE_DESC`, `NAME_ASC`, `POPULARITY`).
3. **Empty State**: When no products match filters, render a clean `EmptyState` component with an action to clear filters.
4. **Responsive Grid**: Always use standard responsive grid breakpoints (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4`).

## Step-by-Step Implementation Flow

### Step 1: PLP Server Component Data Fetching
```tsx
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { getProductsWithErrorHandling } from "@/features/products/actions/get-products";
import { getCategoriesWithErrorHandling } from "@/features/categories/actions/get-categories";
import { ProductCard } from "@/features/products/components/product-card";
import { SearchInput } from "@/components/common/search-input";
import { CategoryTabs } from "@/features/categories/components/category-tabs";
import { ProductSortSelect } from "@/features/products/components/product-sort-select";
import { ProductSortBy } from "@/features/products/types/product.types";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    sortBy?: ProductSortBy;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { store } = await resolveRequestStore();
  const query = await searchParams;

  const pageNumber = Number(query.page) || 1;
  const [productsData, categoriesData] = await Promise.all([
    getProductsWithErrorHandling({
      page: pageNumber,
      limit: 20,
      search: query.search,
      categoryId: query.categoryId,
      sortBy: query.sortBy || ProductSortBy.CREATED_AT_DESC,
    }),
    getCategoriesWithErrorHandling({ page: 1, limit: 50 }),
  ]);

  const products = productsData.products?.items || [];
  const categories = categoriesData.categories?.items || [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <SearchInput defaultValue={query.search} placeholder="Search products..." />
        <ProductSortSelect currentSort={query.sortBy} />
      </div>

      <CategoryTabs categories={categories} activeCategoryId={query.categoryId} />

      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 2: Product Card Implementation with Image Zoom
```tsx
import Image from "next/image";
import Link from "next/link";
import { PublicProductDto } from "@/features/products/types/product.types";
import { formatCurrency } from "@/lib/utils/formatters";

export function ProductCard({ product }: { product: PublicProductDto }) {
  const primaryImage = product.images?.[0]?.url || "/placeholder-product.png";
  const defaultVariant = product.variants?.[0];
  const price = defaultVariant?.price || 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group sf-panel overflow-hidden flex flex-col justify-between bg-card hover:border-primary/50 transition-colors"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover sf-img-zoom group-hover:scale-105 transition-transform duration-300"
        />
        {!product.inStock && (
          <div className="absolute top-2 start-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded font-medium">
            Out of Stock
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm text-foreground line-clamp-2">{product.name}</h3>
        <p className="sf-price text-sm font-bold text-primary">
          {formatCurrency(price, "EGP", "ar")}
        </p>
      </div>
    </Link>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Hardcoded image dimensions without responsive sizes
<Image src={product.image} alt={product.name} width={300} height={300} />

// ✅ REQUIRED — Aspect square fill with responsive sizes
<div className="relative aspect-square">
  <Image
    src={product.image}
    alt={product.name}
    fill
    sizes="(max-width: 640px) 50vw, 25vw"
    className="object-cover sf-img-zoom"
  />
</div>
```
