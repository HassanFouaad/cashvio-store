# AGENTS.md — cashvio-store-front

Index of project standards for Cashvio public multi-tenant storefront (`store-front`). Read only what the task needs.

Standards live in exactly two places:

- `.agents/skills/<name>/SKILL.md` — task-specific standards and step-by-step workflows
- `.cursor/rules/<name>.mdc` — always-on rules (loaded automatically by Cursor)

Resolution order: read the skill; if no skill of that name exists, read the rule file.
Machine-readable catalog of every standard: `.cursor/standards-index.yml`.

## Repository map (`MAP.md`)

When you need the **folder structure**, **where files live**, or a **searchable index** of this codebase — read **`MAP.md`** at the repo root. It is the canonical file tree. Prefer it over guessing paths or running broad filesystem searches.

- **Read**: `MAP.md`
- **Regenerate**: `yarn index:code` · **check sync**: `yarn index:code:check`
- **After adding/moving/renaming files**: run `yarn index:code`
- **Pre-commit**: Husky runs `yarn index:code` and auto-stages `MAP.md` when it changes (`.husky/pre-commit`, `scripts/husky-sync-map.sh`). Run `yarn prepare` after clone.

---

## Before writing code (MANDATORY)

1. Match the task under "Task → standards" below.
2. Read those files before editing anything.
3. Follow every pattern they define.
4. Self-check output against "Never ship", then `.agents/skills/store-front-verify-code/SKILL.md`.

Full procedure: see `.cursor/rules/pre-flight.mdc`

---

## Agent Startup (Non-Cursor / CLI Agents)

If your environment does not auto-load `.cursor/rules/`, read these always-on standards before processing tasks:

- `.cursor/rules/coding-standards.mdc` · `theme-and-design-system.mdc` · `multi-tenancy-and-routing.mdc` · `i18n-and-rtl.mdc` · `api-and-data-fetching.mdc` · `pre-flight.mdc`

---

## Never ship

Front-loaded because these are the easiest to violate by accident.

- `any` or loose `unknown` casts. Missing explicit return types on public functions or API callers.
- Hardcoded hex colors (e.g. `#059669` or `bg-[#10b981]`) — merchant themes are dynamically white-labeled; always use semantic theme tokens (`bg-primary`, `text-primary-foreground`, `bg-card`, `border-border`).
- Physical directional CSS (`pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right`) — always use Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`, `text-end`).
- Directional icons (chevrons, back arrows, next buttons) without `rtl:rotate-180`.
- Hardcoded user copy or aria-labels in JSX — always use `useTranslations()` / `getTranslations()` from `next-intl`.
- Translation key disparity — every key in `messages/en.json` MUST exist with the identical path in `messages/ar.json`.
- Calling the backend with raw `fetch()` or hardcoded URL strings — always use `apiClient` with the `endpoints` catalog.
- Bypassing store context — server components must resolve store context via `resolveRequestStore()` so `X-Store-Id` is bound.
- Unsanitized HTML rendering — always use `SafeHtmlRenderer` (DOMPurify).
- Raw `JSON.stringify()` in `<script type="application/ld+json">` — always use `serializeJsonLd()`.
- Sequential `await` on independent server data fetches — always use `Promise.all` or `Promise.allSettled`.
- Missing `loading.tsx` for route segments.
- Trusting payment gateway URL query parameters on `/payment/result` — always poll `/public/orders/track`.
- Order lookup with `orderNumber` only — guest privacy requires BOTH `orderNumber` AND `phone`.
- Managing shopping cart state in local component `useState` — use global Zustand `useCartStore` with persistent visitor ID.
- `npm` or committing `package-lock.json` — this repository is **Yarn only**.

---

## Naming (applies everywhere)

| Target              | Convention                                 | Example                                                 |
| ------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Components & Props  | PascalCase                                 | `ProductCard.tsx`, `ProductCardProps`                   |
| Files & Directories | kebab-case                                 | `product-details.tsx`, `checkout-form.tsx`              |
| Functions & Methods | camelCase, verb-first                      | `getStoreBySubdomain`, `formatCurrency`                 |
| Variables & Hooks   | camelCase                                  | `selectedVariantId`, `useCartStore`                     |
| Booleans            | Verb prefix (`is`, `has`, `can`, `should`) | `isAvailable`, `hasModifiers`, `canSubmit`              |
| DTOs & Interfaces   | PascalCase                                 | `PublicProductDto`, `CreateOrderRequest`                |
| Enums & Values      | PascalCase enum, `UPPER_SNAKE_CASE` values | `PaymentMethod.ONLINE`, `Locale.ARABIC`                 |
| Constants           | UPPER_SNAKE_CASE                           | `STORE_CACHE_REVALIDATE_SECONDS`                        |
| i18n Keys           | camelCase nested under namespace           | `cart.summaryTitle`, `checkout.validation.nameRequired` |

---

## Stack

- **Framework**: Next.js 16.1.2 (App Router, Turbopack, React Server Components)
- **UI & Runtime**: React 19.2.3 + TypeScript 5.8 (Strict mode)
- **Styling**: Tailwind CSS v4.1.18 (`@tailwindcss/postcss`, semantic `@theme` tokens)
- **Localization**: `next-intl` (Bilingual: Arabic default, English secondary, RTL-first)
- **State Management**: Zustand (Guest Cart Store + persistent visitor session ID)
- **Icons**: `lucide-react` (Theme-governed stroke widths via `data-sf-icons`)
- **Sanitization**: `isomorphic-dompurify` (`SafeHtmlRenderer`)
- **Package Manager**: Yarn
- **Dev Port**: **4000** (`yarn dev`)

---

## Commands

- **Dev**: `yarn dev` (runs Turbopack on port 4000)
- **Build**: `yarn build` (`next build`)
- **Start Production**: `yarn start` (runs on port 4000)
- **Lint**: `yarn lint` (`eslint .`)
- **Index**: `yarn index:code` · check `yarn index:code:check` (`MAP.md` file tree)
- **Hooks**: `yarn prepare` (Husky; pre-commit syncs `MAP.md`)

---

## Structure

High-level layout below. **Full tree**: see **`MAP.md`**.

```
MAP.md repository file tree (run `yarn index:code`)
src/
├── app/                      # Next.js App Router (force-dynamic root layout)
│   ├── layout.tsx            # Global multi-tenant shell, theme injector & providers
│   ├── page.tsx              # Storefront homepage (hero, categories, featured/special grids)
│   ├── loading.tsx           # Route segment loading skeletons
│   ├── error.tsx             # Global client error boundary
│   ├── not-found.tsx         # 404 handler
│   ├── products/             # Product catalog (PLP) & Product Details (PDP)
│   ├── categories/           # Category listing & category-filtered grids
│   ├── cart/                 # Dedicated cart view
│   ├── checkout/             # Guest checkout & multi-fulfillment form
│   ├── track/                # Guest order tracking (orderNumber + phone)
│   ├── payment/result/       # Payment gateway callback verification & polling
│   ├── order-success/        # Session-gated order confirmation recap
│   └── pages/[slug]/         # Dynamic merchant static content / policy pages
├── components/
│   ├── common/               # Shared search inputs, header, footer, bottom navigation
│   ├── home/                 # Homepage hero banners and promo sections
│   ├── icons/                # Brand and payment SVGs (Instapay, Wallet)
│   └── ui/                   # CVA Button, Input, Select, Skeleton, SafeHtmlRenderer
├── features/
│   ├── cart/                 # Zustand cart store, storage sync, and line modifiers
│   ├── categories/           # Category carousels, tabs, and query actions
│   ├── checkout/             # Checkout form, zones, coupons, receipt upload, order preview
│   ├── order-tracking/       # Order tracking lookup, timeline status, and polling
│   ├── products/             # PDP layout variants, variant selector, modifier pickers, PLP
│   └── store/                # Store DTOs, theme presets, SEO config, web events
├── lib/
│   ├── analytics/            # Unified tracking adapters (GTM, Meta Pixel, TikTok Pixel)
│   ├── api/                  # ApiClient singleton, endpoints catalog, resolveRequestStore
│   ├── seo/                  # Dynamic metadata builder, hreflang alternates, canonicals
│   ├── theme/                # Theme resolver, CSS variable builder, dynamic font presets
│   ├── utils/                # cn, currency/date formatters, JSON-LD serializer, phone, whatsapp
│   └── visitor/              # Anonymous visitor ID management & FingerprintJS
├── messages/
│   ├── en.json               # English translations
│   └── ar.json               # Arabic translations (Default)
├── providers/                # StoreProvider, ThemeProvider, VisitorProvider
└── middleware.ts             # Subdomain routing, locale detection, and theme preview header forwarding
```

---

## Task → standards

### Theme, Design System & Styling

- Multi-tenant dynamic branding & semantic tokens: see `.cursor/rules/theme-and-design-system.mdc`
- Theme engine, CSS variables, font presets, and `data-sf-*` attributes: see `.agents/skills/store-front-theme-engine/SKILL.md`
- Tailwind v4 logical properties & RTL layout: see `.cursor/rules/i18n-and-rtl.mdc` and `.agents/skills/store-front-rtl-styling/SKILL.md`
- CVA UI primitives (Button, Input, Select, Skeleton, Sheet): see `.agents/skills/store-front-ui-components/SKILL.md`

### Multi-Tenancy & App Router Pages

- Subdomain routing, middleware, and store context: see `.cursor/rules/multi-tenancy-and-routing.mdc` and `.agents/skills/store-front-multi-tenant-resolution/SKILL.md`
- Server component data fetching, `Promise.all`, and skeletons: see `.agents/skills/store-front-app-router-pages/SKILL.md`
- Product Details Page (PDP) layout variants & modifier groups: see `.agents/skills/store-front-product-details-pdp/SKILL.md`
- Product Listing Page (PLP), search, sorting, and category filters: see `.agents/skills/store-front-product-listing-plp/SKILL.md`
- Guest order tracking & status progression timelines: see `.agents/skills/store-front-order-tracking/SKILL.md`

### Data Fetching, State & Cart

- `ApiClient` methods, endpoints config, and typed `ApiException`: see `.cursor/rules/api-and-data-fetching.mdc` and `.agents/skills/store-front-api-client/SKILL.md`
- Zustand cart store, visitor ID persistence, and debounced sync: see `.agents/skills/store-front-cart-management/SKILL.md`
- Guest checkout, fulfillment methods, order preview, and receipt upload: see `.agents/skills/store-front-checkout-flow/SKILL.md`
- Payment integrations (`CASH`, `ONLINE`, `RECEIPT`): see `.agents/skills/store-front-payment-integrations/SKILL.md`
- Form validation and international phone handling: see `.agents/skills/store-front-form-validation/SKILL.md`

### Localization, SEO, Analytics & Security

- `next-intl` bilingual key parity and formatters: see `.cursor/rules/i18n-and-rtl.mdc` and `.agents/skills/store-front-i18n-localization/SKILL.md`
- Dynamic metadata, OpenGraph, hreflang, and JSON-LD schema: see `.agents/skills/store-front-seo-and-metadata/SKILL.md`
- Analytics adapters (GTM, Meta Pixel, TikTok Pixel): see `.agents/skills/store-front-analytics-and-pixels/SKILL.md`
- DOMPurify HTML sanitization and XSS security: see `.agents/skills/store-front-security-and-sanitization/SKILL.md`

### Code Review & Verification

- Pre-flight rules and post-write checklist: see `.cursor/rules/pre-flight.mdc`
- Comprehensive anti-pattern audit matrix & review protocol: see `.agents/skills/store-front-verify-code/SKILL.md`
