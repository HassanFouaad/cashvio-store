@be/src/modules/stores/models/store-front.model.ts @be/src/modules/stores/controllers/public.stores.controller.ts @be/src/modules/stores/mapper/public-store.mapper.ts @be/src/modules/stores/dtos/public-store.dto.ts

I'm building Saas where clients can create online store and sell products (its additional feature beside my inventory/pos system)

@store-front/src/app/page.tsx I have created the backend (Some apis) we will start by fetching the store details (products/orders will be later)

and I have created this next application for this store front feature

Overview
Build a high-performance, scalable storefront application for a multi-tenant SaaS platform. Each store is uniquely identified by subdomain/domain, fetching store-specific data from our backend API.

Technical Requirements
Core Stack

Next.js 15 (App Router)
TypeScript (strict mode)
React Server Components (RSC) as default
TailwindCSS + shadcn/ui for UI components
Server Actions for mutations
Zod for runtime validation
React Query (TanStack Query) for client-side state management when needed

Architecture Principles

1. Folder Structure - Feature-Based Organization
   src/
   ├── app/ # Next.js App Router
   │ ├── (storefront)/ # Route group for main store
   │ │ ├── layout.tsx # Storefront layout with header/footer
   │ │ ├── page.tsx # Homepage (SSR)
   │ │ ├── products/
   │ │ │ ├── page.tsx # Products listing (SSR)
   │ │ │ └── [slug]/
   │ │ │ └── page.tsx # Product detail (SSR)
   │ │ ├── cart/
   │ │ │ └── page.tsx # Cart page (Client)
   │ │ └── checkout/
   │ │ └── page.tsx # Checkout flow
   │ ├── api/ # API routes (if needed)
   │ └── layout.tsx # Root layout
   │
   ├── features/ # Feature modules (domain-driven)
   │ ├── store/
   │ │ ├── api/ # API calls & server actions
   │ │ │ ├── get-store.ts
   │ │ │ └── queries.ts
   │ │ ├── components/ # Feature-specific components
   │ │ │ ├── store-header.tsx
   │ │ │ └── store-footer.tsx
   │ │ ├── types/ # TypeScript types
   │ │ │ └── store.types.ts
   │ │ └── utils/ # Feature utilities
   │ │
   │ ├── products/
   │ │ ├── api/
   │ │ ├── components/
   │ │ ├── types/
   │ │ └── utils/
   │ │
   │ ├── cart/
   │ └── checkout/
   │
   ├── lib/ # Shared utilities
   │ ├── api/ # Core API layer
   │ │ ├── client.ts # Base fetch wrapper with error handling
   │ │ ├── config.ts # API configuration
   │ │ └── types.ts # Shared API types
   │ ├── utils/ # Helper functions
   │ │ ├── cn.ts # className utility
   │ │ ├── formatters.ts # Currency, date formatters
   │ │ └── validators.ts # Zod schemas
   │ └── constants.ts
   │
   ├── components/ # Shared/UI components
   │ ├── ui/ # shadcn/ui components
   │ └── layouts/ # Layout components
   │
   ├── hooks/ # Shared React hooks
   │ ├── use-store.ts
   │ └── use-cart.ts
   │
   ├── providers/ # React Context providers
   │ ├── query-provider.tsx
   │ └── cart-provider.tsx
   │
   └── styles/
   └── globals.css
2. Network Layer - Bulletproof API Architecture
   Create a type-safe, error-handled API client:

3. SSR Strategy - Performance First
   Use RSC (Server Components) by default for:

Store details (homepage)
Product listings
Product details
Static content

Use Client Components ('use client') only for:

Interactive cart
Search with instant results
Filters with immediate feedback
Checkout forms
User interactions (likes, reviews)

Implement:

generateMetadata() for dynamic SEO
generateStaticParams() for popular products (ISR)
Streaming with <Suspense> and loading.tsx
Parallel data fetching with Promise.all()

5. State Management

Server State: TanStack Query (React Query) for client-side caching
UI State: Zustand for cart, filters (lightweight stores)
Form State: React Hook Form + Zod validation
URL State: useSearchParams for filters, pagination

6. Design System - Modern E-Commerce UX
   Theme Requirements:

Clean, minimal, conversion-optimized design
Mobile-first responsive
Dark mode support (using next-themes)
Smooth animations (Framer Motion for critical interactions only)
Accessible (WCAG 2.1 AA)

Reference inspiration from:

Vercel Commerce
Shopify Dawn theme
Stripe's design system

Color scheme:

Primary: Customizable per store (from backend)
Neutral grays for backgrounds
Semantic colors (success, error, warning)

Typography:

Inter or Geist for UI
Variable fonts for performance

7. Performance Targets

Lighthouse Score: 95+ on all metrics
First Contentful Paint: < 1.2s
Time to Interactive: < 2.5s
Core Web Vitals: All green

Optimizations:

Image optimization with next/image (priority for hero)
Font optimization with next/font
Bundle size monitoring
Code splitting per route
Lazy loading for below-fold content

8. Error Handling & Loading States

Global error.tsx and not-found.tsx
Feature-specific error boundaries
Skeleton screens for loading states
Toast notifications for user feedback
Retry mechanisms for failed requests

9. Environment Configuration
   envNEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_STORE_DOMAIN=yourstorefront.com
10. Code Quality Standards

ESLint + Prettier configured
Absolute imports using @/ alias
Component composition over prop drilling
Custom hooks for reusable logic
Comprehensive TypeScript types (no any)
Meaningful variable names
JSDoc for complex functions

Implementation Steps
Phase 1: Foundation (Current)

Set up the folder structure as specified
Create the API client layer with error handling
Implement store data fetching (SSR)
Build the basic layout (header, footer)
Create the homepage with store details
Set up shadcn/ui and design tokens

Phase 2: Products (Next)
Will be discussed after Phase 1 completion
Phase 3: Cart & Checkout (Future)
Will be discussed after Phase 2 completion
Deliverables for Phase 1

Fully structured Next.js project following the architecture above
Working homepage fetching and displaying store details (SSR)
Reusable API client ready for additional endpoints
Basic design system with shadcn/ui components
Performance-optimized with proper caching strategies
Type-safe throughout the application
Developer-friendly with clear patterns for scaling

Success Criteria

✅ Clean, intuitive code structure
✅ Fast initial page load (< 2s)
✅ Type-safe API calls
✅ Scalable architecture ready for products/orders
✅ Beautiful, modern UI
✅ Production-ready error handling
✅ Easy to add new features without refactoring

Start with Phase 1 implementation. Ask clarifying questions if anything is ambiguous. Focus on creating a solid foundation that will make future features trivial to add.
