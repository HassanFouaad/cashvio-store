# Store Front Catalogue Implementation Summary

## Overview

This document summarizes the implementation of the complete catalogue store front feature, including product listing, category (collection) pages, filtering, sorting, and guest visitor tracking functionality.

## Features Implemented

### 1. Products List Page (`/products`)

**File:** `src/app/products/page.tsx`

Features:
- Paginated product grid display
- Search functionality
- Sorting options (Newest, Name, Price Low to High, Price High to Low)
- In-stock filter
- Responsive grid layout (2 cols mobile → 6 cols desktop)

**Components:**
- `ProductsFilterBar` - Filter and sort controls
- `ProductsGrid` - Reusable paginated grid component

### 2. Category Details Page (`/categories/[id]`)

**File:** `src/app/categories/[id]/page.tsx`

Features:
- Compact category header with image and name
- Products filtered by category
- Search input in filter bar row (mobile-first design)
- Same filter/sort options as products page
- Back to collections navigation

### 3. Navigation Updates

**Files:**
- `src/features/store/components/store-header.tsx`
- `src/components/mobile-menu.tsx`

Added "Collections" link to both desktop and mobile navigation.

### 4. Homepage Updates

**File:** `src/app/page.tsx`

- Removed "Quality Products, Fast Delivery, Customer Support" features section

### 5. Product Details Update

**File:** `src/features/products/components/product-details.tsx`

- Stock count only shows when < 5 items left ("X left in stock")
- Still shows "In Stock" / "Out of Stock" status indicator

## Backend Changes

### 1. New Sorting Enum

**File:** `be/src/modules/products/enums/product-sort.enum.ts`

```typescript
export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  PRICE_LOW_TO_HIGH = 'priceLowToHigh',
  PRICE_HIGH_TO_LOW = 'priceHighToLow',
}
```

### 2. Updated DTOs

**Files:**
- `be/src/modules/products/dtos/list-public-products.dto.ts`
- `be/src/modules/products/dtos/list-products.dto.ts`

Added:
- `sortBy` - Enum for sorting options
- `inStock` - Boolean filter for in-stock products only

### 3. Repository Updates

**File:** `be/src/modules/products/repositories/products.repository.ts`

- Added `buildOrderClause()` method for dynamic sorting
- Price sorting uses subqueries to get min/max variant prices with store-specific pricing

## Frontend File Structure

```
src/
├── app/
│   ├── products/
│   │   ├── page.tsx           # Products list page
│   │   ├── loading.tsx        # Loading skeleton
│   │   └── [id]/
│   │       └── page.tsx       # Product detail (existing)
│   └── categories/
│       ├── page.tsx           # Categories list (existing)
│       ├── loading.tsx        # Loading skeleton (existing)
│       └── [id]/
│           ├── page.tsx       # Category detail page (NEW)
│           └── loading.tsx    # Loading skeleton (NEW)
├── components/
│   └── visitor-tracker.tsx        # Visitor tracking component
├── features/
│   ├── products/
│   │   ├── api/
│   │   │   └── get-products.ts    # Updated with sort/filter params
│   │   ├── components/
│   │   │   ├── products-filter-bar.tsx  # Filter/sort/search controls
│   │   │   ├── products-grid.tsx        # Reusable grid
│   │   │   ├── products-section.tsx     # Homepage products
│   │   │   ├── product-card.tsx         # Product card
│   │   │   └── product-details.tsx      # Updated stock display
│   │   └── types/
│   │       └── product.types.ts     # Added ProductSortBy enum
│   ├── categories/
│   │   └── api/
│   │       └── get-categories.ts    # Added getCategoryById
│   └── visitors/
│       └── api/
│           └── track-visitor.ts     # Server action for tracking
├── lib/
│   ├── api/
│   │   ├── client.ts              # API client with postNoContent()
│   │   └── config.ts              # Added endpoints
│   └── visitor/
│       └── visitor-id.ts          # Visitor ID utilities + FingerprintJS
└── providers/
    └── visitor-provider.tsx       # Visitor context provider
```

## API Endpoints

### List Products (Public)
```
GET /api/v1/public/products
Query params:
  - storeId (required)
  - tenantId (required)
  - page (optional, default: 1)
  - limit (optional, default: 10)
  - name (optional, search filter)
  - categoryId (optional, filter by category)
  - sortBy (optional, enum: createdAt | name | priceLowToHigh | priceHighToLow)
  - inStock (optional, boolean)
```

### Get Category by ID (Public)
```
GET /api/v1/public/categories/:id
Query params:
  - tenantId (required)
```

## Translations

Added translations for both English and Arabic:

### English (`messages/en.json`)
```json
{
  "store": {
    "categories": {
      "backToCollections": "Back to Collections",
      "browseProductsIn": "Browse products in {category}"
    },
    "products": {
      "noResultsOnPage": "No products on this page...",
      "backToFirstPage": "Back to First Page",
      "leftInStock": "left in stock",
      "sortBy": {
        "label": "Sort by",
        "newest": "Newest",
        "name": "Name",
        "priceLowToHigh": "Price: Low to High",
        "priceHighToLow": "Price: High to Low"
      },
      "filters": {
        "inStockOnly": "In Stock Only"
      }
    }
  },
  "errors": {
    "products": {
      "loadFailed": "Unable to load products..."
    }
  }
}
```

## Design Patterns Used

1. **Server-Side Rendering (SSR)** - All pages are server components for SEO
2. **React Cache** - API calls use `cache()` for request deduplication
3. **Client Components** - Only interactive elements (filters, pagination controls)
4. **Reusable Components** - `ProductsGrid` used across multiple pages
5. **Type Safety** - Full TypeScript types matching backend DTOs
6. **i18n** - All user-facing strings use `next-intl` translations

## URL Structure

- `/` - Homepage with featured products
- `/products` - All products with filters/sorting
- `/products/[id]` - Product details
- `/categories` - All collections
- `/categories/[id]` - Collection details with products

## Query Parameters

Products and category pages support:
- `page` - Pagination
- `search` - Text search
- `sortBy` - Sort option
- `inStock` - In-stock filter (boolean)

Example: `/products?sortBy=priceLowToHigh&inStock=true&page=2`

---

## Guest Visitor Tracking

### Overview

The store front implements robust guest visitor tracking using:
- **FingerprintJS** - Industry-standard browser fingerprinting library
- **Cookie-based visitor ID** - UUID stored in httpOnly cookie for 2 years
- **Server Actions** - Proper Next.js patterns for API calls

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Visitor lands on store                                  │
│     ↓                                                       │
│  2. Middleware checks for visitor ID cookie                 │
│     ├─ If exists: Pass through                              │
│     └─ If not: Generate UUID, set cookie (2 years)          │
│     ↓                                                       │
│  3. Layout passes visitor ID to VisitorProvider             │
│     ↓                                                       │
│  4. VisitorProvider initializes:                            │
│     ├─ Syncs cookie with localStorage (backup)              │
│     └─ Generates fingerprint using FingerprintJS (async)    │
│     ↓                                                       │
│  5. VisitorTracker calls server action                      │
│     trackVisitor() → POST /api/v1/public/visitors/track     │
│     ├─ Returns 204 No Content (fire-and-forget)             │
│     ├─ Creates new visitor record (first visit)             │
│     └─ Updates existing record (return visit)               │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Implementation

**Dependencies:**
```json
{
  "@fingerprintjs/fingerprintjs": "^5.0.1"
}
```

**Files:**
- `src/lib/visitor/visitor-id.ts` - Visitor ID utilities with FingerprintJS
- `src/providers/visitor-provider.tsx` - React context provider
- `src/components/visitor-tracker.tsx` - Tracking component
- `src/features/visitors/api/track-visitor.ts` - Server action for tracking
- `src/middleware.ts` - Server-side cookie management
- `src/lib/api/client.ts` - API client with `postNoContent()` method

**Cookie:**
- Name: `sf_visitor_id`
- Duration: 2 years
- SameSite: Lax
- Set by: Middleware (server-side) and VisitorProvider (client-side backup)

**localStorage Keys:**
- `sf_visitor_id` - Backup of visitor ID
- `sf_visitor_fp` - Cached FingerprintJS result

**FingerprintJS:**
Uses the open-source FingerprintJS library which generates a stable browser fingerprint by analyzing:
- Canvas rendering
- WebGL capabilities
- Audio context
- Installed fonts
- Browser plugins
- Hardware concurrency
- And 70+ other signals

### Backend Implementation

**New Module:** `be/src/modules/visitors/`

**Files:**
- `models/store-visitor.model.ts` - Database model
- `dtos/track-visitor.dto.ts` - DTOs (CreateVisitorDto, RecordVisitDto, TrackVisitorDto)
- `dtos/visitor.dto.ts` - Response DTO (internal use)
- `repositories/store-visitors.repository.ts` - Data access
- `services/visitors.service.ts` - Business logic
- `controllers/public.visitors.controller.ts` - API endpoints (returns 204)
- `visitors.module.ts` - NestJS module

**Migration File:** `be/src/database/migrations/20260129002327-create-store-visitors-table.js`

**Database Table:** `store_visitors`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenantId | UUID | Tenant reference |
| storeId | UUID | Store reference |
| visitorId | UUID | Frontend-generated ID |
| fingerprint | TEXT | FingerprintJS hash |
| customerId | UUID | Linked customer (optional) |
| totalVisits | INTEGER | Visit count |
| lastVisitAt | TIMESTAMP | Last visit time |
| firstVisitAt | TIMESTAMP | First visit time |
| userAgent | TEXT | Browser user agent |
| language | TEXT | Browser language |

**Indexes:**
- Unique: `(storeId, visitorId)`
- Index: `tenantId`
- Index: `fingerprint`
- Index: `customerId`
- Index: `visitorId`

### API Endpoints

**Track Visitor Visit (Fire-and-Forget):**
```
POST /api/v1/public/visitors/track
Body:
{
  "storeId": "uuid",
  "visitorId": "uuid",
  "fingerprint": "fp_hash_from_fingerprintjs",
  "userAgent": "Mozilla/5.0...",
  "language": "en"
}

Response: 204 No Content
```

### Using Visitor Data in Components

```tsx
import { useVisitor } from "@/providers/visitor-provider";

function MyComponent() {
  const { visitor, isLoading } = useVisitor();
  
  if (isLoading) return <Loading />;
  
  // Use visitor.visitorId for API calls
  // Use visitor.fingerprint for analytics
}
```

### Using Server Action for Tracking

```tsx
// In a server component or client component
import { trackVisitor } from "@/features/visitors/api/track-visitor";

// Fire-and-forget - no need to await
trackVisitor({
  storeId: "...",
  visitorId: "...",
  fingerprint: "...",
  userAgent: navigator.userAgent,
  language: navigator.language,
});
```

### Future: Linking to Customers

When a guest visitor makes a purchase or creates an account:

```typescript
// Backend service
await visitorsService.linkToCustomer(storeId, visitorId, customerId);
```

This links the visitor record to a customer, enabling:
- Unified order history
- Cart migration
- Personalized recommendations
- Customer analytics
