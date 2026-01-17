# Folder Structure - Complete Overview

## 📁 Full Directory Tree

```
store-front/
│
├── 📄 package.json                    # Dependencies and scripts
├── 📄 tsconfig.json                   # TypeScript configuration
├── 📄 tailwind.config.ts              # TailwindCSS configuration
├── 📄 postcss.config.mjs              # PostCSS configuration
├── 📄 next.config.ts                  # Next.js configuration
├── 📄 .gitignore                      # Git ignore rules
├── 📄 .env.example                    # Environment variables example
├── 📄 .env.local                      # Local environment variables (not in git)
│
├── 📚 Documentation/
│   ├── 📄 README.md                   # Main documentation
│   ├── 📄 DEVELOPMENT.md              # Development guide
│   ├── 📄 QUICK-START.md              # Quick start guide
│   ├── 📄 IMPLEMENTATION-SUMMARY.md   # Phase 1 summary
│   ├── 📄 FOLDER-STRUCTURE.md         # This file
│   └── 📄 abstract.md                 # Project requirements
│
├── 📂 public/                         # Static assets
│   ├── favicon.ico
│   └── images/
│
└── 📂 src/                            # Source code
    │
    ├── 📂 app/                        # Next.js App Router (Pages & Routing)
    │   ├── 📄 layout.tsx              # Root layout (providers, fonts)
    │   ├── 📄 page.tsx                # Landing page (/)
    │   ├── 📄 globals.css             # Global styles
    │   ├── 📄 error.tsx               # Global error boundary
    │   ├── 📄 not-found.tsx           # 404 page
    │   │
    │   └── 📂 store/
    │       └── 📂 [code]/             # Dynamic store routes
    │           ├── 📄 layout.tsx      # Store layout (header/footer)
    │           ├── 📄 page.tsx        # Store homepage
    │           └── 📄 loading.tsx     # Loading state
    │
    ├── 📂 features/                   # Feature Modules (Domain Logic)
    │   └── 📂 store/                  # Store feature
    │       │
    │       ├── 📂 api/                # API layer
    │       │   ├── 📄 get-store.ts    # Server actions for fetching store
    │       │   └── 📄 queries.ts      # React Query hooks
    │       │
    │       ├── 📂 components/         # Store-specific components
    │       │   ├── 📄 store-header.tsx      # Header with logo, nav, cart
    │       │   ├── 📄 store-footer.tsx      # Footer with links, social
    │       │   ├── 📄 store-hero.tsx        # Hero carousel
    │       │   ├── 📄 store-error.tsx       # Error states
    │       │   └── 📄 store-loading.tsx     # Loading skeletons
    │       │
    │       ├── 📂 types/              # TypeScript types
    │       │   └── 📄 store.types.ts  # Store DTOs and types
    │       │
    │       └── 📂 utils/              # Feature utilities
    │           └── 📄 store-resolver.ts     # Store code extraction
    │
    ├── 📂 lib/                        # Shared Utilities & Core Logic
    │   │
    │   ├── 📂 api/                    # Core API layer
    │   │   ├── 📄 client.ts           # Base API client with error handling
    │   │   ├── 📄 config.ts           # API endpoints configuration
    │   │   └── 📄 types.ts            # API types (ApiResponse, ApiError)
    │   │
    │   ├── 📂 utils/                  # Helper functions
    │   │   ├── 📄 cn.ts               # className utility (clsx + tailwind-merge)
    │   │   └── 📄 formatters.ts       # Currency, date, phone formatters
    │   │
    │   └── 📄 constants.ts            # App-wide constants
    │
    ├── 📂 components/                 # Shared UI Components
    │   └── 📂 ui/                     # shadcn/ui components
    │       ├── 📄 button.tsx          # Button component with variants
    │       └── 📄 skeleton.tsx        # Loading skeleton
    │
    └── 📂 providers/                  # React Context Providers
        └── 📄 query-provider.tsx      # React Query provider
```

## 📋 File Descriptions

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Project dependencies and scripts |
| `tsconfig.json` | TypeScript compiler options |
| `tailwind.config.ts` | TailwindCSS theme and plugins |
| `postcss.config.mjs` | PostCSS plugins (Tailwind, Autoprefixer) |
| `next.config.ts` | Next.js configuration |
| `.gitignore` | Files to ignore in git |
| `.env.example` | Environment variables template |
| `.env.local` | Local environment variables (gitignored) |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main documentation and architecture overview |
| `DEVELOPMENT.md` | How to develop and add new features |
| `QUICK-START.md` | Get started in 5 minutes |
| `IMPLEMENTATION-SUMMARY.md` | What's been implemented in Phase 1 |
| `FOLDER-STRUCTURE.md` | This file - folder structure reference |
| `abstract.md` | Original project requirements |

### App Directory (`src/app/`)

Next.js App Router - handles routing and page rendering.

| File/Folder | Route | Purpose |
|-------------|-------|---------|
| `layout.tsx` | All routes | Root layout with providers |
| `page.tsx` | `/` | Landing page |
| `error.tsx` | All routes | Global error boundary |
| `not-found.tsx` | 404 | Page not found |
| `store/[code]/layout.tsx` | `/store/*` | Store layout (header/footer) |
| `store/[code]/page.tsx` | `/store/{code}` | Store homepage |
| `store/[code]/loading.tsx` | `/store/{code}` | Loading state |

### Features Directory (`src/features/`)

Domain-driven feature modules. Each feature is self-contained.

#### Store Feature (`src/features/store/`)

| Folder | Purpose | Files |
|--------|---------|-------|
| `api/` | Data fetching | `get-store.ts`, `queries.ts` |
| `components/` | UI components | Header, Footer, Hero, Error, Loading |
| `types/` | TypeScript types | `store.types.ts` |
| `utils/` | Feature utilities | `store-resolver.ts` |

### Lib Directory (`src/lib/`)

Shared utilities used across features.

#### API Layer (`src/lib/api/`)

| File | Purpose |
|------|---------|
| `client.ts` | Base API client with timeout, error handling |
| `config.ts` | API base URL and endpoint definitions |
| `types.ts` | API response types, error types |

#### Utils (`src/lib/utils/`)

| File | Purpose |
|------|---------|
| `cn.ts` | Merge className strings (clsx + tailwind-merge) |
| `formatters.ts` | Format currency, dates, phone numbers |

#### Constants (`src/lib/constants.ts`)

App-wide constants (routes, cache keys, etc.)

### Components Directory (`src/components/`)

Reusable UI components.

#### UI Components (`src/components/ui/`)

shadcn/ui components - reusable, accessible, customizable.

| File | Purpose |
|------|---------|
| `button.tsx` | Button with variants (default, outline, ghost, etc.) |
| `skeleton.tsx` | Loading skeleton for shimmer effect |

### Providers Directory (`src/providers/`)

React Context providers for global state.

| File | Purpose |
|------|---------|
| `query-provider.tsx` | React Query provider for data caching |

## 🎯 When to Add Files Where

### Adding a New Page

**Location**: `src/app/your-page/page.tsx`

```typescript
// src/app/about/page.tsx
export default function AboutPage() {
  return <div>About</div>;
}
```

### Adding a New Feature

**Location**: `src/features/your-feature/`

```
src/features/products/
├── api/
│   ├── get-products.ts
│   └── queries.ts
├── components/
│   ├── product-card.tsx
│   └── product-list.tsx
├── types/
│   └── product.types.ts
└── utils/
    └── product-helpers.ts
```

### Adding a New API Endpoint

**Location**: `src/lib/api/config.ts`

```typescript
export const endpoints = {
  stores: {
    getByCode: (code: string) => `/public/stores/${code}`,
  },
  products: {
    list: (storeId: string) => `/public/stores/${storeId}/products`,
  },
} as const;
```

### Adding a New UI Component

**Location**: `src/components/ui/your-component.tsx`

Or use shadcn/ui CLI:
```bash
npx shadcn@latest add card
```

### Adding a New Utility Function

**Location**: `src/lib/utils/your-utility.ts`

```typescript
// src/lib/utils/validators.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Adding a New Provider

**Location**: `src/providers/your-provider.tsx`

```typescript
// src/providers/cart-provider.tsx
'use client';

export function CartProvider({ children }) {
  // Provider logic
  return <CartContext.Provider>{children}</CartContext.Provider>;
}
```

## 📊 File Count Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/app/` | 7 | Pages and routing |
| `src/features/store/` | 9 | Store feature module |
| `src/lib/` | 6 | Shared utilities |
| `src/components/ui/` | 2 | UI components |
| `src/providers/` | 1 | React providers |
| Root configs | 6 | Configuration files |
| Documentation | 6 | Guides and docs |
| **Total** | **37+** | Complete Phase 1 |

## 🔄 Data Flow

```
User Request
    ↓
Next.js App Router (src/app/)
    ↓
Page Component (src/app/store/[code]/page.tsx)
    ↓
Server Action (src/features/store/api/get-store.ts)
    ↓
API Client (src/lib/api/client.ts)
    ↓
Backend API
    ↓
Response
    ↓
Type Validation (src/features/store/types/store.types.ts)
    ↓
Component Rendering (src/features/store/components/)
    ↓
User sees page
```

## 🎨 Import Paths

Thanks to TypeScript path mapping (`@/*`), imports are clean:

```typescript
// ✅ Good: Using @ alias
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { StoreHeader } from '@/features/store/components/store-header';

// ❌ Bad: Relative paths
import { apiClient } from '../../../lib/api/client';
import { Button } from '../../components/ui/button';
```

## 🚀 Scalability

This structure scales easily:

```
src/features/
├── store/          # ✅ Phase 1
├── products/       # 🔜 Phase 2
├── cart/           # 🔜 Phase 3
├── checkout/       # 🔜 Phase 3
├── orders/         # 🔜 Future
└── reviews/        # 🔜 Future
```

Each feature is independent and follows the same pattern!

## 📝 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `store-header.tsx` |
| Components | PascalCase | `StoreHeader` |
| Functions | camelCase | `getStoreByCode` |
| Types | PascalCase | `PublicStoreDto` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Folders | kebab-case | `store-feature/` |

---

**This structure is designed for**:
- ✅ Easy navigation
- ✅ Clear separation of concerns
- ✅ Scalability
- ✅ Maintainability
- ✅ Team collaboration
