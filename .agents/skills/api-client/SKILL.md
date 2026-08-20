---
name: api-client
description: ApiClient singleton methods, endpoint configuration, header injection, typed error handling, and envelope parsing
---

# ApiClient & Network Communication

How to use the centralized `ApiClient` singleton to perform typed API requests against the Cashvio backend, handle envelope unwrapping, configure endpoints, and safely capture errors.

## When to Use
- Writing server actions, data-fetching functions, or client-side mutations.
- Adding new public API routes to `src/lib/api/config.ts`.
- Handling API errors with `ApiException`.
- Fetching paginated collections with `apiClient.getPaginated<T>`.

## Core Rules & Invariants
1. **Always use `apiClient` singleton**: Never call raw `fetch()` or `axios`.
2. **Always route through `endpoints` catalog**: Never hardcode URL strings like `/public/products`. Reference `endpoints.products.getPublic()`.
3. **No manual `X-Store-Id` header construction**: The `apiClient` automatically injects `X-Store-Id` and `Accept-Language` from the request context or browser cookie.
4. **Safe Error Handlers (`*WithErrorHandling`)**: Server-side data fetching functions must catch `ApiException` and return `{ data, error }` to prevent Next.js RSC crashes.

## Step-by-Step Implementation Flow

### Step 1: Registering Endpoints in `src/lib/api/config.ts`
```typescript
export const endpoints = {
  // ... existing endpoints
  reviews: {
    list: (productId: string) => `/public/products/${productId}/reviews`,
    create: (productId: string) => `/public/products/${productId}/reviews`,
  },
} as const;
```

### Step 2: Implementing a Data Fetcher Function
```typescript
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { ApiException } from "@/lib/api/types";
import { PublicProductReviewDto, CreateReviewRequest } from "../types/reviews.types";

export async function getProductReviewsWithErrorHandling(
  productId: string
): Promise<{ reviews: PublicProductReviewDto[] | null; error: Error | null }> {
  try {
    const data = await apiClient.get<PublicProductReviewDto[]>(
      endpoints.reviews.list(productId)
    );
    return { reviews: data, error: null };
  } catch (error) {
    return {
      reviews: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function submitProductReview(
  productId: string,
  payload: CreateReviewRequest
): Promise<PublicProductReviewDto> {
  return apiClient.post<PublicProductReviewDto, CreateReviewRequest>(
    endpoints.reviews.create(productId),
    payload
  );
}
```

### Step 3: Handling Paginated Lists
```typescript
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { PaginatedResponse } from "@/lib/api/types";
import { PublicProductDto, ListProductsQuery } from "../types/product.types";

export async function getProducts(
  query: ListProductsQuery
): Promise<PaginatedResponse<PublicProductDto>> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.categoryId) searchParams.set("categoryId", query.categoryId);
  if (query.search) searchParams.set("search", query.search);
  if (query.sortBy) searchParams.set("sortBy", query.sortBy);

  return apiClient.getPaginated<PublicProductDto>(
    `${endpoints.products.getPublic()}?${searchParams.toString()}`
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```typescript
// ❌ FORBIDDEN — Raw fetch, hardcoded URL, no store context, unhandled error
export async function getCategories() {
  const res = await fetch("https://api.cash-vio.com/api/v1/public/categories", {
    headers: { "X-Store-Id": "123" }
  });
  const data = await res.json();
  return data.data.items;
}

// ✅ REQUIRED — apiClient with endpoints catalog and typed error handling
export async function getCategoriesWithErrorHandling(query?: ListCategoriesQuery) {
  try {
    const params = buildCategoryQueryParams(query);
    const response = await apiClient.getPaginated<PublicCategoryDto>(
      `${endpoints.categories.list}?${params.toString()}`
    );
    return { categories: response, error: null };
  } catch (error) {
    return { categories: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
```
