---
name: store-front-app-router-pages
description: Server Component data fetching, force-dynamic rendering, parallel Promise.all, route error boundaries, and loading skeletons
---

# Next.js App Router pages

Use for routes under `src/app/`, their loading/error states, metadata and independent server reads. These are slices of the current Cashvio project task.

## Read established implementations

- `src/app/page.tsx`: request context, parallel API reads, merchant-aware home sections.
- `src/app/loading.tsx`: the actual hero/category/product skeleton geometry.
- `src/app/error.tsx`: translated recoverable root error state.
- `src/app/products/[id]/page.tsx`: async parameters, resource lookup and metadata.
- `src/app/layout.tsx`: dynamic root shell and active-store contract.

## Implementation

1. Keep the root's `force-dynamic` and `revalidate = 0` contract. Await async route parameters.
2. Call `resolveRequestStore()` before scoped reads; establish and validate the store before parallelizing its dependent resource queries.
3. Use actual fetchers from `features/categories/api/get-categories`, `features/products/api/get-products` and `features/products/api/get-special-products`. Independent reads use `Promise.all` or `Promise.allSettled`; dependencies do not.
4. Reuse `StoreHero`, `CategoriesSection`, `ProductsSection` and `SpecialProductsSection` from their existing feature folders. Read their real prop types instead of inventing hero/grid/carousel imports.
5. Preserve `*WithErrorHandling` results and honest error/empty behavior. Do not turn failed reads into claims of an empty store.
6. Add the appropriate `loading.tsx` using existing `Skeleton` primitives and geometry matching the route. The home loading implementation does not depend on a nonexistent `ProductCardSkeleton`.
7. Reuse the translated error boundary and semantic/RTL styling. No hardcoded error strings, physical-direction classes or new merchant palette colors.
8. Generate metadata with the current page helpers, locale/host context and safe JSON-LD utilities. Do not add a nonexistent shared metadata service.

## Verify

Run the task-relevant contracts and build/lint/type checks. For changed UI, verify loading, empty, error/retry, en/ar/RTL, keyboard and mobile/desktop behavior. Validate scoped request behavior in the integrated Cashvio task; source examples alone are not browser evidence.
