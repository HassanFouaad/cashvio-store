# Development Guide - StoreFront

## Quick Start

### Prerequisites
- Node.js 20+ and Yarn
- Backend API running on `http://localhost:3001`

### Setup
```bash
# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your backend URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Start development server
yarn dev
```

Visit `http://localhost:3000` to see the landing page.

## File Organization

### When to Create Files Where

#### `/src/app/*` - Pages and Layouts
- **Purpose**: Next.js routing and page components
- **Create here**: Routes, layouts, loading states, error boundaries
- **Example**: `/src/app/store/[code]/page.tsx`

#### `/src/features/*` - Feature Modules
- **Purpose**: Domain-specific logic and components
- **Create here**: Business logic, API calls, feature-specific components
- **Example**: `/src/features/store/api/get-store.ts`

#### `/src/lib/*` - Shared Utilities
- **Purpose**: Reusable utilities and configurations
- **Create here**: API client, formatters, constants
- **Example**: `/src/lib/api/client.ts`

#### `/src/components/ui/*` - UI Components
- **Purpose**: Reusable UI components (shadcn/ui)
- **Create here**: Buttons, cards, dialogs, etc.
- **Example**: `/src/components/ui/button.tsx`

#### `/src/components/common/*` - Shared Components
- **Purpose**: Reusable components across features
- **Create here**: Pagination controls, search bars, filters
- **Example**: `/src/components/common/pagination-controls.tsx`

#### `/src/lib/types/*` - Shared Types
- **Purpose**: Reusable TypeScript types and interfaces
- **Create here**: Generic types like PaginatedResponse
- **Example**: `/src/lib/types/pagination.types.ts`

#### `/src/providers/*` - React Providers
- **Purpose**: Context providers and global state
- **Create here**: React Query, theme, auth providers
- **Example**: `/src/providers/query-provider.tsx`

### Feature Module Structure

When creating a new feature (e.g., categories, products), follow this structure:

```
src/features/store/
├── api/
│   ├── get-categories.ts        # Server actions
│   └── category-queries.ts      # React Query hooks (if needed)
├── components/
│   ├── category-card.tsx        # Presentational components
│   ├── categories-section.tsx   # Feature sections
│   ├── categories-grid.tsx      # Grid/list views
│   └── categories-loading.tsx   # Loading states
└── types/
    └── category.types.ts        # TypeScript types

src/app/store/[code]/categories/
├── page.tsx                     # Main page (SSR)
└── loading.tsx                  # Page loading state
```

**Key Principles**:
1. **api/**: Server actions and React Query hooks
2. **components/**: Feature-specific components (can be Server or Client)
3. **types/**: TypeScript interfaces extending shared types
4. **app/**: Pages that compose feature components

## Architecture Patterns

### Server Components vs Client Components

#### Use Server Components (default) for:
```typescript
// ✅ No 'use client' directive needed
// src/app/store/[code]/page.tsx
export default async function StorePage({ params }: Props) {
  const store = await getStoreByCode(params.code);
  return <StoreView store={store} />;
}
```

Benefits:
- Faster initial load
- Better SEO
- Direct database/API access
- Smaller bundle size

#### Use Client Components for:
```typescript
// ✅ Add 'use client' at the top
'use client';

import { useState } from 'react';

export function InteractiveCart() {
  const [items, setItems] = useState([]);
  // ... interactive logic
}
```

When needed:
- `useState`, `useEffect`, event handlers
- Browser APIs (localStorage, etc.)
- Interactive UI (modals, dropdowns)
- Real-time updates

### Data Fetching Patterns

#### Pattern 1: Server Actions (Recommended for Server Components)
```typescript
// src/features/store/api/get-store.ts
'use server';

export async function getStoreByCode(code: string) {
  return apiClient.get<PublicStoreDto>(
    endpoints.stores.getByCode(code)
  );
}

// Usage in page
const store = await getStoreByCode(code);
```

#### Pattern 2: React Query (For Client Components)
```typescript
// src/features/store/api/queries.ts
'use client';

export function useStore(code: string) {
  return useQuery({
    queryKey: ['store', code],
    queryFn: () => apiClient.get(endpoints.stores.getByCode(code)),
  });
}

// Usage in component
const { data: store, isLoading, error } = useStore(code);
```

### Pagination Pattern (SSR + Client Controls)

**Best Practice**: Keep data fetching in Server Components, only pagination controls as Client Components.

#### 1. Define Reusable Pagination Types

```typescript
// src/lib/types/pagination.types.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
```

#### 2. Extend in Feature Types

```typescript
// src/features/store/types/category.types.ts
import { PaginatedResponse, PaginationQuery } from '@/lib/types/pagination.types';

export interface PublicCategoryDto {
  id: string;
  name: string;
}

// Extend the reusable type
export interface PaginatedCategoriesResponse 
  extends PaginatedResponse<PublicCategoryDto> {}

export interface ListCategoriesQuery extends PaginationQuery {
  tenantId: string;
  name?: string;
}
```

#### 3. Server Action with Pagination

```typescript
// src/features/store/api/get-categories.ts
'use server';

export async function getCategories(
  query: ListCategoriesQuery
): Promise<PaginatedCategoriesResponse> {
  const searchParams = new URLSearchParams({
    tenantId: query.tenantId,
    page: query.page?.toString() || '1',
    limit: query.limit?.toString() || '10',
    ...(query.name && { name: query.name }),
  });

  return apiClient.get<PublicCategoryDto[]>(
    `${endpoints.categories.list}?${searchParams.toString()}`
  );
}
```

#### 4. SSR Component with Client Pagination

```typescript
// src/features/store/components/categories-grid.tsx
// Server Component (default)
export async function CategoriesGrid({ categories, storeCode, pagination }) {
  const t = await getTranslations('store.categories');

  return (
    <div>
      {/* SSR Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Client-side Pagination Controls */}
      <PaginationControls 
        pagination={pagination}
        baseUrl={`/store/${storeCode}/categories`}
      />
    </div>
  );
}
```

#### 5. Reusable Pagination Controls (Client)

```typescript
// src/components/common/pagination-controls.tsx
'use client';

export function PaginationControls({ pagination, baseUrl }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => handlePageChange(pagination.page - 1)}>
        Previous
      </Button>
      <span>{pagination.page} of {pagination.totalPages}</span>
      <Button onClick={() => handlePageChange(pagination.page + 1)}>
        Next
      </Button>
    </div>
  );
}
```

#### 6. Page with Pagination

```typescript
// src/app/store/[code]/categories/page.tsx
export default async function CategoriesPage({ params, searchParams }) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  const { categories } = await getCategoriesWithErrorHandling({
    tenantId: store.tenantId,
    page,
    limit: 24,
  });

  return <CategoriesGrid categories={categories.items} pagination={...} />;
}
```

**Benefits**:
- ✅ Better SEO (data is server-rendered)
- ✅ Faster initial load
- ✅ Client-side navigation for pagination
- ✅ Type-safe and reusable
- ✅ Works without JavaScript (progressive enhancement)

### Horizontal Scrolling Pattern

For displaying categories, featured items, or collections in a single scrollable row:

```typescript
// Server Component
export async function CategoriesSection({ categories, storeCode }) {
  const t = await getTranslations('store');

  return (
    <section className="w-full py-8">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
          <Link href={`/store/${storeCode}/categories`}>
            {t('categories.viewAll')}
          </Link>
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative">
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-4 min-w-max">
              {categories.map((category) => (
                <div key={category.id} className="w-[150px] shrink-0">
                  <CategoryCard category={category} />
                </div>
              ))}
            </div>
          </div>

          {/* Fade Gradients */}
          <div className="pointer-events-none absolute top-0 start-0 h-full w-8 bg-gradient-to-e from-background to-transparent" />
          <div className="pointer-events-none absolute top-0 end-0 h-full w-8 bg-gradient-to-s from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}
```

**Key Features**:
- Fixed width items with `shrink-0`
- `overflow-x-auto` for scrolling
- `min-w-max` on flex container
- Fade gradients for visual polish (use `start-`/`end-` for RTL support)
- `scrollbar-thin` for modern scrollbars

### Error Handling

#### Server-Side Errors
```typescript
// Return error object instead of throwing
export async function getStoreWithErrorHandling(code: string) {
  try {
    const store = await getStoreByCode(code);
    return { store, error: null };
  } catch (error) {
    return {
      store: null,
      error: {
        type: StoreErrorType.NOT_FOUND,
        message: 'Store not found',
      },
    };
  }
}
```

#### Client-Side Errors
```typescript
// Use error boundaries
'use client';

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## 🚨 Pagination System (CRITICAL - DO NOT REMOVE)

### Overview

Our application uses a **shared pagination utility system** to prevent common bugs like string concatenation issues (e.g., "1" + 1 = "11" instead of 2).

### ⚠️ Why This Matters

**ALWAYS use the shared pagination utilities!** Direct number operations on pagination data can fail because:
- Backend may return pagination values as strings
- JavaScript's type coercion can cause unexpected behavior
- "page 1" + 1 becomes "page 11" (string concatenation) instead of "page 2"

### Shared Pagination Utilities

**Pagination Logic**: `src/lib/utils/pagination.ts`
**Query Params**: `src/lib/utils/query-params.ts`

#### Pagination Functions

1. **`normalizePagination(pagination)`** - ALWAYS use this first!
```typescript
// Ensures all pagination values are numbers
const normalized = normalizePagination(pagination);
// normalized.page is guaranteed to be a number, not "1"
```

2. **`isFirstPage(pagination)`** - Check if on first page
```typescript
const isFirst = isFirstPage(pagination);  // true if page === 1
```

3. **`isLastPage(pagination)`** - Check if on last page
```typescript
const isLast = isLastPage(pagination);  // true if page === totalPages
```

4. **`isValidPage(page, totalPages)`** - Validate page number
```typescript
if (isValidPage(newPage, totalPages)) {
  // Safe to navigate
}
```

5. **`getSafePage(page, totalPages)`** - Clamp page to valid range
```typescript
const safePage = getSafePage(page, totalPages);  // Always between 1 and totalPages
```

6. **`buildPaginationParams(page, limit, additionalParams)`** - Build URL params
```typescript
const params = buildPaginationParams(1, 10, { search: 'query' });
// Returns URLSearchParams ready for API calls
```

7. **`getPaginationInfo(pagination)`** - Get display info
```typescript
const info = getPaginationInfo(pagination);
// { startItem: 1, endItem: 10, totalItems: 100, hasItems: true }
```

#### Query Parameter Functions

Location: `src/lib/utils/query-params.ts`

1. **`parsePage(pageParam, defaultPage?)`** - Safely parse page from URL
```typescript
const page = parsePage(searchParams.page);  // Returns 1 if invalid
// Handles: undefined, null, "hassona", "1.5", "-1" -> all return 1
```

2. **`parseLimit(limitParam, defaultLimit?, maxLimit?)`** - Safely parse limit
```typescript
const limit = parseLimit(searchParams.limit, 10, 100);
// Clamps between 1 and maxLimit
```

3. **`cleanPaginationParams(searchParams)`** - Clean malformed params
```typescript
const clean = cleanPaginationParams({ page: "hassona", limit: "abc" });
// Returns: { page: undefined, limit: undefined } - safe defaults
```

#### Pagination Redirect Functions

Location: `src/lib/utils/pagination-redirect.ts`

1. **`validatePaginationAndRedirect(pagination, requestedPage, baseUrl, searchParams?)`** - Auto-redirect on invalid page
```typescript
// Automatically redirects if requestedPage is out of range
validatePaginationAndRedirect(
  data.pagination,
  requestedPage,
  `/store/${code}/categories`,
  { search: 'query' }
);
// No manual redirect logic needed!
```

2. **`buildPaginationUrl(baseUrl, page?, searchParams?)`** - Build pagination URLs
```typescript
const url = buildPaginationUrl('/store/ABC/products', 2, { search: 'laptop' });
// Returns: '/store/ABC/products?page=2&search=laptop'
// Omits page=1 automatically
```

### Usage Examples

#### ✅ CORRECT - Page Component with Generic Utilities

```typescript
import { parsePage } from '@/lib/utils/query-params';
import { validatePaginationAndRedirect } from '@/lib/utils/pagination-redirect';

export default async function CategoriesPage({ params, searchParams }) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  
  // ✅ Safely parse page - handles malformed input
  const requestedPage = parsePage(resolvedSearchParams.page);
  // Input: "hassona" -> Returns: 1
  // Input: "999" -> Returns: 999 (validated below)
  
  const search = resolvedSearchParams.search || '';
  
  // Fetch data
  const { data, pagination, error } = await getData({
    page: requestedPage,
    search,
  });
  
  // ✅ Generic validation & redirect - one line!
  validatePaginationAndRedirect(
    pagination,
    requestedPage,
    `/store/${code}/categories`,
    { search }
  );
  
  // If we reach here, page is valid
  return <Grid data={data} pagination={pagination} />;
}
```

#### ✅ CORRECT - Component with Normalized Pagination

```typescript
import { normalizePagination, isFirstPage, isLastPage } from '@/lib/utils/pagination';

export function PaginationControls({ pagination }) {
  // ✅ Always normalize first
  const normalized = normalizePagination(pagination);
  
  // ✅ Use utility functions
  const isFirst = isFirstPage(normalized);
  const isLast = isLastPage(normalized);
  
  const handleNext = () => {
    // ✅ Safe arithmetic - guaranteed numbers
    const nextPage = normalized.page + 1;  // Will be 2, not "11"
    navigate(nextPage);
  };
  
  return (
    <div>
      <button disabled={isFirst}>Previous</button>
      <span>{normalized.page} of {normalized.totalPages}</span>
      <button disabled={isLast}>Next</button>
    </div>
  );
}
```

#### ❌ WRONG - Direct Operations

```typescript
// ❌ NEVER DO THIS - Can cause bugs!
export default async function CategoriesPage({ searchParams }) {
  // ❌ No validation - crashes on malformed input
  const page = parseInt(searchParams.page);  // NaN if "hassona"
  
  // ❌ No range checking
  const data = await getData(page);  // Might fetch page 999 of 2!
}

export function PaginationControls({ pagination }) {
  // ❌ page might be "1" (string)
  const nextPage = pagination.page + 1;  // Could be "11" instead of 2!
  
  // ❌ Direct comparison with string
  if (pagination.page === 1) { }  // Might fail if page is "1"
  
  // ❌ No validation
  navigate(nextPage);  // Might go to invalid page
}
```

### Integration Points

#### 1. API Client (`src/lib/api/client.ts`)
```typescript
// ✅ Already implemented
return {
  items: apiResponse.data,
  pagination: normalizePagination(apiResponse.meta.pagination),
};
```

#### 2. Pagination Controls (`src/components/common/pagination-controls.tsx`)
```typescript
// ✅ Use utilities for state checks
const normalized = normalizePagination(pagination);
const isFirst = isFirstPage(normalized);
const isLast = isLastPage(normalized);
```

#### 3. Feature Components (e.g., `categories-grid.tsx`)
```typescript
// ✅ Normalize before use
const normalized = normalizePagination(pagination);

if (normalized.page > 1 && items.length === 0) {
  // Show "no results on this page" with pagination controls
}
```

### 🎯 Implementation Checklist

When implementing pagination:

**In Page Components (Server):**
- [ ] Import from `@/lib/utils` (centralized exports)
- [ ] Use `parsePage()` to safely parse URL params (handles malformed input)
- [ ] Use `validatePaginationAndRedirect()` after fetching data (one-liner!)
- [ ] No manual redirect logic needed

**In Client Components:**
- [ ] Always call `normalizePagination()` before using pagination data
- [ ] Use `isFirstPage()` and `isLastPage()` for button states
- [ ] Use `isValidPage()` before navigation
- [ ] Use `buildPaginationUrl()` for navigation links

**Never Do:**
- [ ] Never do direct arithmetic on pagination values
- [ ] Never directly compare pagination values without normalizing
- [ ] Never use `parseInt()` without `parsePage()` wrapper
- [ ] Never build URLs manually - use `buildPaginationUrl()`

### 🐛 Common Bugs Prevented

1. **String concatenation**: "1" + 1 = "11"
2. **Type coercion failures**: "1" === 1 returns false
3. **Invalid page navigation**: Going to page -1 or beyond totalPages
4. **Disabled button logic**: Previous button showing on page 1
5. **Empty page handling**: Being stuck on empty pages
6. **Malformed query strings**: `?page=hassona` crashes the app
7. **Out of range pages**: Being stuck on page 50 of 2 pages
8. **NaN arithmetic**: `parseInt("abc")` causing calculation errors

### 📚 See Also

- **API Types Guide**: `/docs/API-TYPES-GUIDE.md`
- **Pagination Utilities**: `/src/lib/utils/pagination.ts`
- **Query Param Utilities**: `/src/lib/utils/query-params.ts`
- **Redirect Utilities**: `/src/lib/utils/pagination-redirect.ts`
- **Centralized Exports**: `/src/lib/utils/index.ts`
- **Example Implementation**: `/src/components/common/pagination-controls.tsx`
- **Example Page**: `/src/app/store/[code]/categories/page.tsx`

---

## Common Development Tasks

### Task 0: Add a New Paginated Feature

Follow this pattern for any paginated list (products, orders, etc.):

1. **Create types extending reusable pagination**:
```typescript
// src/features/products/types/product.types.ts
import { PaginatedResponse, PaginationQuery } from '@/lib/api/types';

export interface ProductDto {
  id: string;
  name: string;
  price: number;
}

// ✅ Use type alias for clarity
export type PaginatedProductsResponse = PaginatedResponse<ProductDto>;

export interface ListProductsQuery extends PaginationQuery {
  tenantId: string;
  categoryId?: string;
  search?: string;
}
```

2. **Create server action**:
```typescript
// src/features/products/api/get-products.ts
'use server';

import { apiClient } from '@/lib/api/client';
import { buildPaginationParams } from '@/lib/utils/pagination';

export async function getProducts(
  query: ListProductsQuery
): Promise<PaginatedProductsResponse> {
  // ✅ Use utility to build params
  const params = buildPaginationParams(
    query.page,
    query.limit,
    {
      tenantId: query.tenantId,
      categoryId: query.categoryId,
      search: query.search,
    }
  );

  // ✅ Use getPaginated for paginated endpoints
  return apiClient.getPaginated<ProductDto>(
    `${endpoints.products.list}?${params.toString()}`
  );
}
```

3. **Create SSR grid component**:
```typescript
// src/features/products/components/products-grid.tsx
import { PaginationControls } from '@/components/common/pagination-controls';
import { normalizePagination } from '@/lib/utils/pagination';

export async function ProductsGrid({ products, storeCode, pagination }) {
  // ✅ Always normalize pagination
  const normalizedPagination = normalizePagination(pagination);
  
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <PaginationControls 
        pagination={normalizedPagination}
        baseUrl={`/store/${storeCode}/products`}
      />
    </div>
  );
}
```

4. **Create page**:
```typescript
// src/app/store/[code]/products/page.tsx
export default async function ProductsPage({ params, searchParams }) {
  const { code } = await params;
  const { page = '1' } = await searchParams;
  
  const store = await getStoreByCode(code);
  const { products } = await getProducts({
    tenantId: store.tenantId,
    page: parseInt(page, 10),
    limit: 24,
  });

  return (
    <ProductsGrid 
      products={products.items}
      storeCode={code}
      pagination={products}
    />
  );
}
```

5. **Add translations**:
```json
// messages/en.json
{
  "products": {
    "title": "Products",
    "noProducts": "No products found",
    "previous": "Previous",
    "next": "Next",
    "of": "of"
  }
}
```

**Pattern Benefits**:
- ✅ Fully type-safe with TypeScript
- ✅ Reusable across all paginated features
- ✅ SEO-friendly (server-rendered)
- ✅ Client-side navigation
- ✅ Easy to extend with filters

### Task 1: Add a New Page

1. **Create the page file**:
```typescript
// src/app/store/[code]/about/page.tsx
export default async function AboutPage({ params }: Props) {
  const { code } = await params;
  return <div>About {code}</div>;
}
```

2. **Add metadata**:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'About Us',
    description: 'Learn more about our store',
  };
}
```

3. **Add navigation link**:
```typescript
// In store-header.tsx
<Link href={`/store/${store.code}/about`}>About</Link>
```

### Task 2: Add a New API Endpoint

1. **Define endpoint in config**:
```typescript
// src/lib/api/config.ts
export const endpoints = {
  stores: {
    getByCode: (code: string) => `/public/stores/${code}`,
  },
  products: {
    list: (storeId: string) => `/public/stores/${storeId}/products`,
  },
} as const;
```

2. **Create types**:
```typescript
// src/features/products/types/product.types.ts
export interface ProductDto {
  id: string;
  name: string;
  price: number;
}
```

3. **Create server action**:
```typescript
// src/features/products/api/get-products.ts
'use server';

export async function getProducts(storeId: string) {
  return apiClient.get<ProductDto[]>(
    endpoints.products.list(storeId)
  );
}
```

4. **Use in page**:
```typescript
// src/app/store/[code]/products/page.tsx
export default async function ProductsPage({ params }: Props) {
  const store = await getStoreByCode(params.code);
  const products = await getProducts(store.id);
  return <ProductList products={products} />;
}
```

### Task 3: Add a New UI Component

1. **Use shadcn/ui if available**:
```bash
npx shadcn@latest add card
```

2. **Or create custom component**:
```typescript
// src/components/ui/custom-component.tsx
import { cn } from '@/lib/utils/cn';

interface CustomComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function CustomComponent({ className, children }: CustomComponentProps) {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
}
```

### Task 4: Add Client-Side Interactivity

1. **Create client component**:
```typescript
// src/features/cart/components/add-to-cart-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    // Add to cart logic
    setIsAdding(false);
  };

  return (
    <Button onClick={handleAddToCart} disabled={isAdding}>
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
}
```

2. **Use in server component**:
```typescript
// src/app/store/[code]/products/[id]/page.tsx
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

## Styling Guidelines

### Using Tailwind CSS

```typescript
// ✅ Good: Use Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-bold">Title</h2>
</div>

// ✅ Good: Use cn() for conditional classes
import { cn } from '@/lib/utils/cn';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}>
```

### Component Variants

```typescript
// Use class-variance-authority for variants
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'base-styles',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white',
        outline: 'border border-primary',
      },
      size: {
        sm: 'px-2 py-1 text-sm',
        lg: 'px-6 py-3 text-lg',
      },
    },
  }
);
```

## Testing Your Changes

### Manual Testing Checklist

- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (responsive design)
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test error states (invalid store code, network errors)
- [ ] Test loading states
- [ ] Check console for errors
- [ ] Verify TypeScript compilation (`yarn build`)

### Testing Scenarios

1. **Valid Store**: `/store/VALID_CODE`
2. **Invalid Store**: `/store/INVALID`
3. **Inactive Store**: Create inactive store in backend
4. **Network Error**: Stop backend server
5. **Slow Network**: Use DevTools throttling

## Debugging Tips

### 1. API Issues

```typescript
// Add logging in API client
console.log('Fetching:', url);
console.log('Response:', response);
```

### 2. Hydration Errors

```typescript
// Ensure server and client render the same
// Use suppressHydrationWarning for dynamic content
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>
```

### 3. TypeScript Errors

```bash
# Check types
yarn tsc --noEmit

# Fix auto-fixable issues
yarn lint --fix
```

### 4. Performance Issues

```typescript
// Use React DevTools Profiler
// Check for unnecessary re-renders
// Memoize expensive computations
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

## Production Checklist

Before deploying:

- [ ] Run `yarn build` successfully
- [ ] Test production build locally (`yarn start`)
- [ ] Update environment variables
- [ ] Check all images have alt text
- [ ] Verify SEO meta tags
- [ ] Test on multiple devices
- [ ] Check Lighthouse scores (aim for 90+)
- [ ] Review error handling
- [ ] Test with real backend data

## Real-World Examples

### Categories Feature (Reference Implementation)

The categories feature demonstrates all best practices:

**Backend (NestJS)**:
- ✅ `findAllForPublicView` - Paginated repository method
- ✅ Extends `PaginationDto` in DTOs
- ✅ Returns `PaginatedResponseDto<T>`

**Frontend (Next.js 15)**:
- ✅ Reusable `PaginatedResponse<T>` type
- ✅ Server actions for data fetching
- ✅ SSR components for rendering
- ✅ Client pagination controls
- ✅ Horizontal scrolling section on homepage
- ✅ Full grid page with pagination
- ✅ i18n support (English & Arabic)
- ✅ RTL support
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

**Files to Review**:
- `src/lib/types/pagination.types.ts` - Reusable types
- `src/features/store/types/category.types.ts` - Feature types
- `src/features/store/api/get-categories.ts` - Server actions
- `src/features/store/components/categories-section.tsx` - Horizontal scroll (SSR)
- `src/features/store/components/categories-grid.tsx` - Grid view (SSR)
- `src/components/common/pagination-controls.tsx` - Reusable pagination (Client)
- `src/app/store/[code]/categories/page.tsx` - Full page

**API Endpoint**:
```
GET /api/v1/public/categories
Query: tenantId, page, limit, name
Response: PaginatedResponse<PublicCategoryDto>
```

Use this implementation as a template for products, orders, and other paginated features.

## Need Help?

- Check the main README.md for architecture overview
- Review existing code for patterns
- **Reference the categories implementation for paginated features**
- Check Next.js 15 documentation
- Review TailwindCSS documentation
- Check shadcn/ui component examples
