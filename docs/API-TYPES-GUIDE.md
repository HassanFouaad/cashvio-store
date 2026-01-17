# API Types & Network Layer Guide

## Overview

This guide explains the unified API response structure and how to use the network layer correctly.

## Backend Response Structure

The backend uses a **single unified response format** for all endpoints via the `ResponseTransformer`:

### Non-Paginated Response
```typescript
{
  success: true,
  data: T,  // Single object or array
  meta: {
    timestamp: "2024-01-17T10:00:00Z"
  }
}
```

### Paginated Response
```typescript
{
  success: true,
  data: T[],  // Array of items
  meta: {
    timestamp: "2024-01-17T10:00:00Z",
    pagination: {
      page: 1,
      limit: 10,
      totalItems: 100,
      totalPages: 10
    }
  }
}
```

**Key Point**: They're the same structure! Paginated responses just have an additional `meta.pagination` property.

## Type Definitions

### Core Types (`src/lib/api/types.ts`)

```typescript
// Unified API response for both paginated and non-paginated
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    pagination?: PaginationMeta;  // Only present for paginated
  };
}

// Application-level paginated response (transformed)
interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Pagination metadata
interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
```

## API Client Usage

### Non-Paginated Requests

```typescript
import { apiClient } from '@/lib/api/client';

// Returns the data directly (unwrapped)
const store = await apiClient.get<StoreDto>('/api/v1/stores/123');
// store is of type StoreDto, not ApiResponse<StoreDto>
```

### Paginated Requests

```typescript
import { apiClient } from '@/lib/api/client';

// Returns transformed paginated response
const result = await apiClient.getPaginated<CategoryDto>(
  '/api/v1/categories?page=1&limit=10'
);
// result is { items: CategoryDto[], pagination: PaginationMeta }

// Access items
result.items.forEach(category => console.log(category.name));

// Access pagination
console.log(result.pagination.page);        // 1
console.log(result.pagination.totalItems);  // 100
```

## Creating Feature-Specific Types

### Step 1: Define Your DTO (matches backend)

```typescript
// src/features/products/types/product.types.ts
export interface ProductDto {
  id: string;
  name: string;
  price: number;
}
```

### Step 2: Define Query Parameters (if needed)

```typescript
import { PaginationQuery } from '@/lib/api/types';

export interface ListProductsQuery extends PaginationQuery {
  storeId: string;
  categoryId?: string;
  search?: string;
}
```

### Step 3: Create Type Alias for Paginated Response

```typescript
import { PaginatedResponse } from '@/lib/api/types';

export type PaginatedProductsResponse = PaginatedResponse<ProductDto>;
```

### Step 4: Create API Function

```typescript
// src/features/products/api/get-products.ts
'use server';

import { apiClient } from '@/lib/api/client';
import { ListProductsQuery, PaginatedProductsResponse } from '../types';

export async function getProducts(
  query: ListProductsQuery
): Promise<PaginatedProductsResponse> {
  const params = new URLSearchParams({
    storeId: query.storeId,
    page: query.page?.toString() || '1',
    limit: query.limit?.toString() || '10',
    ...(query.categoryId && { categoryId: query.categoryId }),
    ...(query.search && { search: query.search }),
  });

  return apiClient.getPaginated<ProductDto>(
    `/api/v1/products?${params.toString()}`
  );
}
```

## Best Practices

### ✅ DO

1. **Use `getPaginated<T>()` for paginated endpoints**
   ```typescript
   const result = await apiClient.getPaginated<CategoryDto>(endpoint);
   ```

2. **Use `get<T>()` for non-paginated endpoints**
   ```typescript
   const store = await apiClient.get<StoreDto>(endpoint);
   ```

3. **Create type aliases for clarity**
   ```typescript
   export type PaginatedCategoriesResponse = PaginatedResponse<CategoryDto>;
   ```

4. **Extend `PaginationQuery` for query parameters**
   ```typescript
   interface ListCategoriesQuery extends PaginationQuery {
     tenantId: string;
   }
   ```

### ❌ DON'T

1. **Don't cast to `any`**
   ```typescript
   // ❌ BAD
   return response as any;
   
   // ✅ GOOD
   return apiClient.getPaginated<CategoryDto>(endpoint);
   ```

2. **Don't create duplicate pagination types**
   ```typescript
   // ❌ BAD - duplicates PaginationMeta
   interface MyPaginationMeta {
     page: number;
     limit: number;
     total: number;
   }
   
   // ✅ GOOD - import from types
   import { PaginationMeta } from '@/lib/api/types';
   ```

3. **Don't manually unwrap responses**
   ```typescript
   // ❌ BAD
   const response = await fetch(url);
   const json = await response.json();
   const data = json.data;
   
   // ✅ GOOD - client handles unwrapping
   const data = await apiClient.get<T>(endpoint);
   ```

## Error Handling

All API methods throw `ApiException` on errors:

```typescript
import { ApiException } from '@/lib/api/types';

try {
  const products = await getProducts({ storeId: '123' });
} catch (error) {
  if (error instanceof ApiException) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  }
}
```

## Summary

- **One unified `ApiResponse<T>` type** for all responses
- **Paginated responses** have `meta.pagination` added
- **Use `get<T>()`** for non-paginated data
- **Use `getPaginated<T>()`** for paginated data
- **No type casting needed** - everything is strongly typed
- **No duplication** - all types in one place
