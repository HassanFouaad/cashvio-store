---
name: app-router-pages
description: Server Component data fetching, force-dynamic rendering, parallel Promise.all, route error boundaries, and loading skeletons
---

# Next.js App Router Page Architecture

How to structure Next.js App Router server components, implement parallel data fetching with `Promise.all`, enforce dynamic rendering, and provide matching loading skeletons.

## When to Use

- Adding or modifying any route under `src/app/` (`/`, `/products`, `/categories`, `/cart`, `/checkout`, `/track`, `/pages/[slug]`).
- Implementing segment `loading.tsx` skeletons and `error.tsx` boundaries.
- Fetching multiple server-side resources concurrently.

## Core Rules & Invariants

1. **Dynamic Rendering**: The root layout `src/app/layout.tsx` enforces `export const dynamic = 'force-dynamic'` and `revalidate = 0`.
2. **Parallel Server Fetching**: Independent data fetching operations must be fetched concurrently with `Promise.all` or `Promise.allSettled`. Never await them sequentially.
3. **Geometry-Matching Skeletons**: Every route folder must contain a `loading.tsx` whose skeleton geometry closely matches the final rendered page layout.
4. **Catch Errors with `*WithErrorHandling`**: Use error-handling wrappers to avoid unhandled promise rejections crashing the RSC tree.

## Step-by-Step Implementation Flow

### Step 1: Route Implementation with Parallel Data Fetching

```tsx
import { notFound } from "next/navigation";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { getProductsWithErrorHandling } from "@/features/products/actions/get-products";
import { getCategoriesWithErrorHandling } from "@/features/categories/actions/get-categories";
import { getSpecialProductsWithErrorHandling } from "@/features/products/actions/get-special-products";
import { HeroBanner } from "@/components/home/hero-banner";
import { ProductGrid } from "@/features/products/components/product-grid";
import { CategoryCarousel } from "@/features/categories/components/category-carousel";

export default async function HomePage() {
  const { store, subdomain } = await resolveRequestStore();
  if (!subdomain || !store) {
    notFound();
  }

  // Fetch all home sections in parallel
  const [categoriesRes, productsRes, specialRes] = await Promise.all([
    getCategoriesWithErrorHandling({ page: 1, limit: 10 }),
    getProductsWithErrorHandling({ page: 1, limit: 12 }),
    getSpecialProductsWithErrorHandling(),
  ]);

  const categories = categoriesRes.categories?.items || [];
  const featuredProducts = productsRes.products?.items || [];
  const specialProducts = specialRes.specialProducts || [];

  return (
    <div className="space-y-12 pb-16">
      <HeroBanner store={store} />
      <CategoryCarousel categories={categories} />
      <ProductGrid title="Featured Products" products={featuredProducts} />
      {specialProducts.length > 0 && (
        <ProductGrid title="Special Offers" products={specialProducts} />
      )}
    </div>
  );
}
```

### Step 2: Route Loading Skeleton (`src/app/loading.tsx`)

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/features/products/components/product-card-skeleton";

export default function HomeLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Skeleton */}
      <Skeleton className="h-64 sm:h-96 w-full rounded-2xl" />

      {/* Categories Row Skeleton */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Route Error Boundary (`src/app/error.tsx`)

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront runtime error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-24 text-center space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        We encountered an error while loading this page. Please try again.
      </p>
      <Button variant="default" onClick={() => reset()}>
        Try Again
      </Button>
    </div>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```typescript
// ❌ FORBIDDEN — Waterfall sequential data fetching in Server Component
const store = await getStore();
const products = await getProducts();
const categories = await getCategories();

// ✅ REQUIRED — Parallel fetch with Promise.all
const [products, categories] = await Promise.all([
  getProductsWithErrorHandling(),
  getCategoriesWithErrorHandling(),
]);
```
