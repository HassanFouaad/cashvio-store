# Search Implementation Guide

## Overview

This guide documents the end-to-end search implementation for the categories page, following the patterns established in DEVELOPMENT.md and FOLDER-STRUCTURE.md.

## Backend Implementation

### API Endpoint

**Endpoint**: `GET /api/v1/public/categories`

**Query Parameters**:
```typescript
{
  tenantId: string;  // Required
  name?: string;     // Optional - search query
  page?: number;     // Pagination
  limit?: number;    // Pagination
}
```

### Backend Search Logic

Location: `be/src/modules/categories/repositories/categories.repository.ts`

```typescript
async findAllForPublicView(query?: ListCategoriesDto) {
  const { page = 1, limit = 10, name } = query || {};
  
  const whereClause: any = {};
  
  // Case-insensitive partial match search
  if (name) {
    whereClause.name = { [Op.iLike]: `%${name}%` };
  }
  
  const result = await this.categoryModel.findAndCountAll({
    where: whereClause,
    offset: (page - 1) * limit,
    limit,
    order: [['name', 'ASC']],
  });
  
  return new PaginatedResponseDto(
    result.rows,
    result.count,
    page,
    limit
  );
}
```

**Key Features**:
- ✅ Case-insensitive search (`iLike`)
- ✅ Partial matching (`%query%`)
- ✅ Returns paginated results
- ✅ Works with existing pagination system

## Frontend Implementation

### Architecture

Following the documentation patterns:

```
src/
├── components/
│   ├── common/
│   │   └── search-input.tsx       # Reusable search component (Client)
│   └── ui/
│       └── input.tsx               # Base input component
├── hooks/
│   └── use-debounce.ts             # Debounce hook for search
├── app/
│   └── store/[code]/categories/
│       └── page.tsx                # Page with search integration (Server)
└── features/
    └── store/
        └── api/
            └── get-categories.ts   # API call with search param
```

### 1. Debounce Hook (`src/hooks/use-debounce.ts`)

**Purpose**: Prevents excessive API calls while user is typing

```typescript
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void
```

**Usage**:
```typescript
const handleSearch = useDebounce((value: string) => {
  // This will only fire 300ms after user stops typing
  router.push(`/categories?search=${value}`);
}, 300);
```

**Benefits**:
- Reduces API calls by ~90%
- Improves performance
- Better UX (no lag while typing)

### 2. Search Input Component (`src/components/common/search-input.tsx`)

**Type**: Client Component (`'use client'`)

**Features**:
- ✅ Debounced search (300ms default)
- ✅ URL-based state (preserves search on refresh)
- ✅ Resets to page 1 on new search
- ✅ Preserves other URL params
- ✅ Clear button when has value
- ✅ Loading indicator
- ✅ Accessible (ARIA labels)

**Props**:
```typescript
interface SearchInputProps {
  baseUrl: string;          // e.g., '/store/ABC/categories'
  placeholder?: string;     // Placeholder text
  searchKey?: string;       // URL param key (default: 'search')
  debounceMs?: number;      // Debounce delay (default: 300)
}
```

**Usage**:
```typescript
<SearchInput
  baseUrl={`/store/${storeCode}/categories`}
  placeholder="Search categories..."
  searchKey="search"
/>
```

### 3. Page Integration (`src/app/store/[code]/categories/page.tsx`)

**Type**: Server Component (SSR)

**Flow**:
1. Parse search query from URL
2. Fetch categories with search param
3. Validate pagination (redirect if needed)
4. Render search input (Client) + results (Server)

```typescript
export default async function CategoriesPage({ params, searchParams }) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Parse page and search safely
  const requestedPage = parsePage(resolvedSearchParams.page);
  const search = resolvedSearchParams.search || '';
  
  // Fetch with search parameter
  const { categories, error } = await getCategoriesWithErrorHandling({
    tenantId: store.tenantId,
    page: requestedPage,
    limit: 12,
    name: search || undefined,  // Backend expects 'name' param
  });
  
  // Validate and redirect if needed
  validatePaginationAndRedirect(
    categories?.pagination,
    requestedPage,
    `/store/${code}/categories`,
    { search }  // Preserve search in redirect
  );
  
  return (
    <div>
      {/* Search Input - Client Component */}
      <SearchInput
        baseUrl={`/store/${code}/categories`}
        placeholder={t('store.categories.searchPlaceholder')}
      />
      
      {/* Results Grid - Server Component */}
      <CategoriesGrid
        categories={categories.items}
        pagination={categories.pagination}
      />
    </div>
  );
}
```

## URL Parameter Handling

### Clean URLs

The implementation ensures clean, user-friendly URLs:

| Scenario | URL | Behavior |
|----------|-----|----------|
| **Initial load** | `/store/ABC/categories` | Shows all categories, page 1 |
| **Search** | `/store/ABC/categories?search=electronics` | Filters by "electronics", page 1 |
| **Search + Page** | `/store/ABC/categories?page=2&search=electronics` | Filtered results, page 2 |
| **Clear search** | `/store/ABC/categories` | Returns to all categories |
| **Invalid page** | `/store/ABC/categories?page=50&search=test` | Redirects to last valid page |

### Parameter Preservation

When navigating, the search input preserves other URL parameters:
- ✅ Search is preserved when paginating
- ✅ Other filters are preserved (if added in future)
- ✅ Page resets to 1 on new search
- ✅ Page=1 is omitted from URL

## User Experience

### Search Flow

1. **User types** "Electronics" in search box
2. **Debounce waits** 300ms for user to finish typing
3. **URL updates** to `/categories?search=Electronics`
4. **Server refetches** with search parameter
5. **Page rerenders** with filtered results
6. **Pagination resets** to page 1

### Edge Cases Handled

✅ **Empty search**: Returns all categories
✅ **No results**: Shows "no categories found" message
✅ **Special characters**: Properly escaped in URL
✅ **Long queries**: Truncated in URL if needed
✅ **Concurrent searches**: Only latest search is applied
✅ **Fast typing**: Debounced to prevent lag

## Performance Optimizations

### 1. Debouncing
- **Without**: 10 chars = 10 API calls
- **With**: 10 chars = 1 API call (300ms after typing stops)
- **Savings**: ~90% reduction in API calls

### 2. URL State
- **Benefit**: No client-side state management needed
- **Result**: Simpler code, works with browser back/forward
- **SEO**: Search results are indexable

### 3. Server Components
- **Grid rendering**: Done on server (faster initial load)
- **Search input**: Client component (required for interactivity)
- **Optimal split**: Best of both worlds

## Testing Checklist

### Functional Tests
- [ ] Search returns filtered results
- [ ] Empty search shows all categories
- [ ] Clear button removes search
- [ ] Pagination works with search
- [ ] URL reflects search state
- [ ] Browser back/forward works
- [ ] Refresh preserves search

### Edge Case Tests
- [ ] Search with no results
- [ ] Special characters in search
- [ ] Very long search queries
- [ ] Rapid typing (debounce test)
- [ ] Navigate away and back
- [ ] Malformed search params

### Performance Tests
- [ ] Debounce reduces API calls
- [ ] No lag while typing
- [ ] Search feels instantaneous
- [ ] Loading indicator shows
- [ ] Results update smoothly

## Extensibility

### Adding Search to Other Pages

To add search to products, orders, etc:

1. **Verify backend supports search** (check DTO)
2. **Add SearchInput** to the page
3. **Pass search param** to API call
4. **Preserve in redirects**

Example for products:
```typescript
// pages/store/[code]/products/page.tsx
export default async function ProductsPage({ searchParams }) {
  const search = searchParams.search || '';
  
  const products = await getProducts({
    storeId,
    search,  // Add this
    page: requestedPage,
  });
  
  return (
    <>
      <SearchInput
        baseUrl={`/store/${code}/products`}
        placeholder="Search products..."
      />
      <ProductsGrid products={products} />
    </>
  );
}
```

### Adding Filters

To add category filter, status filter, etc:

1. **Update SearchInput** to accept filter params
2. **Preserve filters** in URL
3. **Create filter components** (dropdowns, checkboxes)
4. **Pass to backend** in API call

## Best Practices

### DO ✅
- Use debounce for search inputs
- Preserve search in URL
- Reset to page 1 on new search
- Show loading indicator
- Handle empty results gracefully
- Use semantic HTML
- Add ARIA labels

### DON'T ❌
- Search on every keystroke (no debounce)
- Store search in local state only
- Keep user on page 10 after search
- Block UI while searching
- Ignore empty results case
- Use non-semantic elements
- Forget accessibility

## Troubleshooting

### Search Not Working

**Problem**: Typing doesn't trigger search

**Solutions**:
- Check debounce is working
- Verify SearchInput is client component
- Check browser console for errors
- Verify baseUrl is correct

### Results Not Updating

**Problem**: Search returns old results

**Solutions**:
- Check server action is called
- Verify search param is passed to API
- Check backend search implementation
- Clear Next.js cache

### URL Not Updating

**Problem**: URL doesn't change on search

**Solutions**:
- Verify router.push() is called
- Check buildPaginationUrl() logic
- Ensure baseUrl is correct
- Check for JavaScript errors

## Related Documentation

- **Development Guide**: `/docs/DEVELOPMENT.md`
- **Folder Structure**: `/docs/FOLDER-STRUCTURE.md`
- **API Types Guide**: `/docs/API-TYPES-GUIDE.md`
- **Pagination System**: `/docs/DEVELOPMENT.md#pagination-system`

## Summary

✅ **End-to-end search** implemented following documentation patterns
✅ **Backend**: Case-insensitive partial matching
✅ **Frontend**: Debounced, URL-based, accessible
✅ **Performance**: Optimized with debouncing and SSR
✅ **UX**: Clean URLs, instant feedback, proper error handling
✅ **Maintainable**: Reusable components, clear patterns
✅ **Extensible**: Easy to add to other pages
