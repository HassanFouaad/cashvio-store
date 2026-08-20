---
name: multi-tenant-resolution
description: Subdomain resolution, middleware routing, store context injection, and active storefront enforcement
---

# Multi-Tenant Subdomain Resolution & Store Context

How to resolve tenant stores from the incoming HTTP request host, inject store context into the server and client runtime, and enforce active storefront access gates.

## When to Use
- Adding or modifying server-side routes, layouts, or `generateMetadata` functions.
- Inspecting how `X-Store-Id` is populated for backend API requests.
- Handling subdomain parsing, custom domain routing, or reserved subdomains.
- Handling inactive store status or missing store fallbacks.

## Core Rules & Invariants
1. **Always use `resolveRequestStore()`**: In Server Components and `generateMetadata`, retrieve the store context exclusively through `resolveRequestStore()` in `src/lib/api/resolve-request-store.ts`.
2. **Never query without `X-Store-Id`**: The backend public API requires `X-Store-Id`. `resolveRequestStore()` automatically calls `setApiStoreId(store.id)` and `setApiLocale(locale)` on the request context.
3. **Inactive Gate**: If `store.storeFront.status !== StoreFrontStatus.ACTIVE`, render `StoreErrorComponent` with type `INACTIVE` in `layout.tsx` to halt rendering.
4. **Subdomain Validation**: Subdomains in `RESERVED_SUBDOMAINS` (`www`, `api`, `admin`, `app`, etc.) or apex domains with non-root paths are blocked in `src/middleware.ts`.

## Step-by-Step Implementation Flow

### Step 1: Server Component Store Resolution
```typescript
import { notFound } from "next/navigation";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { getProductByIdWithErrorHandling } from "@/features/products/actions/get-products";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  // 1. Resolve store context (React.cache deduplicated)
  const { store, subdomain } = await resolveRequestStore();
  if (!subdomain || !store) {
    notFound();
  }

  // 2. Fetch resource using store context already set in ApiClient
  const { id } = await params;
  const { product, error } = await getProductByIdWithErrorHandling(id);
  if (error || !product) {
    notFound();
  }

  return <ProductDetails product={product} store={store} />;
}
```

### Step 2: Metadata Resolution
```typescript
import { Metadata } from "next";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { store } = await resolveRequestStore();
  const { id } = await params;
  const { product } = await getProductByIdWithErrorHandling(id);

  if (!product || !store) {
    return { title: "Product Not Found" };
  }

  return buildPageMetadata({
    title: product.name,
    description: product.description || store.name,
    image: product.images?.[0]?.url,
    store,
  });
}
```

### Step 3: Client Component Store Context Access
```tsx
"use client";

import { useStore } from "@/providers/store-provider";

export function StoreBadge() {
  const store = useStore();
  return <div className="text-sm font-medium">{store.name}</div>;
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```typescript
// ❌ FORBIDDEN — Accessing headers directly and calling backend without store context setup
import { headers } from "next/headers";
export default async function Page() {
  const host = (await headers()).get("host");
  const store = await fetch(`http://backend/api/v1/public/stores/by-subdomain/${host}`).then(r => r.json());
  return <div>{store.name}</div>;
}

// ✅ REQUIRED — Using resolveRequestStore with caching & API context binding
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
export default async function Page() {
  const { store, subdomain } = await resolveRequestStore();
  if (!store) notFound();
  return <div>{store.name}</div>;
}
```
