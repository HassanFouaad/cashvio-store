---
name: store-front-verify-code
description: Comprehensive anti-pattern audit protocol, layer-specific checks, 20-item anti-pattern matrix, and verification report format
---

# Code Review & Verification Protocol (verify-code)

MANDATORY verification skill for auditing any code changes in the `store-front` project. Use this before declaring any task complete.

## When to Use

- Auditing new or modified code before presenting it to the user.
- Running quality, security, and architectural checks.
- Generating a standardized code verification report.

---

## Step 1: Identify Changed Files & Category Mapping

Map all modified and new files to their respective architectural categories:

| File Pattern                          | Category           | Key Standards to Verify                                                 |
| ------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `src/app/**/page.tsx`, `layout.tsx`   | App Router Pages   | `multi-tenancy-and-routing.mdc`, `app-router-pages`, `seo-and-metadata` |
| `src/app/**/loading.tsx`, `error.tsx` | Error / Loading    | `app-router-pages`, `ui-components`                                     |
| `src/lib/theme/**`, `globals.css`     | Theme Engine       | `theme-and-design-system.mdc`, `theme-engine`                           |
| `src/lib/api/**`                      | API Client         | `api-and-data-fetching.mdc`, `api-client`                               |
| `src/features/cart/**`                | Cart Management    | `cart-management`, `api-client`                                         |
| `src/features/checkout/**`            | Checkout & Orders  | `checkout-flow`, `payment-integrations`, `form-validation`              |
| `src/features/products/**`            | Products (PDP/PLP) | `product-details-pdp`, `product-listing-plp`, `seo-and-metadata`        |
| `src/features/order-tracking/**`      | Order Tracking     | `order-tracking`, `payment-integrations`                                |
| `src/components/ui/**`                | UI Primitives      | `theme-and-design-system.mdc`, `ui-components`                          |
| `messages/{en,ar}.json`               | Localization       | `i18n-and-rtl.mdc`, `i18n-localization`                                 |

---

## Step 2: Universal Blocking Checks (Must Pass 100%)

Check all modified code against these non-negotiable blocking rules:

- [ ] **No `any` or loose `unknown` casts**: Zero instances of `any`, `as any`, or `<any>`.
- [ ] **Explicit Return Types**: All exported functions and server actions declare return types.
- [ ] **No Hardcoded Hex Colors**: Components exclusively use semantic tokens (`bg-primary`, `text-card-foreground`, `border-border`).
- [ ] **Bilingual Translation Parity**: Every key in `messages/en.json` exists in `messages/ar.json`.
- [ ] **Tailwind Logical Properties**: Spacing and positioning use `ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`, `text-start`.
- [ ] **RTL Icon Flipping**: Directional icons have `rtl:rotate-180`.
- [ ] **Store Context Attached**: Server components resolve store via `resolveRequestStore()` before API queries.
- [ ] **XSS Sanitization**: HTML rendered with `SafeHtmlRenderer` (DOMPurify) and JSON-LD serialized with `serializeJsonLd()`.
- [ ] **Safe Parallel Data Fetching**: Independent server calls use `Promise.all` / `Promise.allSettled`.
- [ ] **Package Manager**: Yarn only (never npm).

---

## Step 3: Anti-Pattern Detection Matrix (20 Checked Items)

| #   | Anti-Pattern                                                  | Why it is Forbidden                                       | Required Remediation                                                 |
| --- | ------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | `any` / `as any` type casting                                 | Bypasses TypeScript compiler safety                       | Use explicit DTO interfaces or typed generics                        |
| 2   | Hardcoded hex color (e.g. `#059669`)                          | Breaks multi-tenant dynamic merchant branding             | Use semantic Tailwind tokens (`bg-primary`, `text-primary`)          |
| 3   | Physical CSS (`pl-`, `pr-`, `left-`)                          | Breaks layout in Arabic (RTL) mode                        | Use logical properties (`ps-`, `pe-`, `start-`)                      |
| 4   | Directional icon without `rtl:rotate-180`                     | Chevrons and arrows point backwards in RTL                | Add `rtl:rotate-180` to chevron/arrow classes                        |
| 5   | Hardcoded user-facing text in JSX                             | Breaks bilingual English/Arabic localization              | Use `useTranslations()` / `getTranslations()` from `next-intl`       |
| 6   | Unsanitized `dangerouslySetInnerHTML`                         | Causes Cross-Site Scripting (XSS) vulnerability           | Use `SafeHtmlRenderer` with DOMPurify                                |
| 7   | `JSON.stringify` inside `<script type="application/ld+json">` | Script tag injection vulnerability                        | Use `serializeJsonLd()` from `@/lib/utils/json-ld`                   |
| 8   | Missing Arabic translation key in `ar.json`                   | Causes runtime crash in `next-intl`                       | Add identical key hierarchy to both `messages/en.json` and `ar.json` |
| 9   | Direct raw `fetch()` call                                     | Bypasses store ID injection, timeouts, and error handling | Use `apiClient.get/post/getPaginated`                                |
| 10  | Hardcoded API path (e.g. `/public/products`)                  | Breaks centralized endpoint configuration                 | Use `endpoints.products.getPublic()` from `@/lib/api/config`         |
| 11  | Sequential `await` on independent fetches                     | Increases Server Component Time to First Byte (TTFB)      | Execute in parallel using `Promise.all`                              |
| 12  | Missing `loading.tsx` for route segment                       | Degrades perceived user performance                       | Add `loading.tsx` with matching skeleton geometry                    |
| 13  | Manual currency formatting (e.g. `${price} EGP`)              | Inconsistent formatting across locales                    | Use `formatCurrency(amount, currency, locale)`                       |
| 14  | Trusting payment gateway URL query params                     | Security vulnerability; enables spoofed orders            | Poll `/public/orders/track` to verify status                         |
| 15  | Looking up order by `orderNumber` only                        | Privacy violation; allows guest order scraping            | Require BOTH `orderNumber` AND `phone` in track API                  |
| 16  | Missing `aria-label` on icon buttons                          | Screen reader accessibility violation                     | Add translated `aria-label={t("...")}`                               |
| 17  | Hardcoded image dimensions without responsive sizes           | Poor LCP score and distorted layout on mobile             | Use `next/image` with `fill`, `sizes`, and `sf-img-zoom`             |
| 18  | Base64 receipt image in `createOrder`                         | Bloats HTTP payload and exhausts server RAM               | Upload to S3 presigned URL; send `receiptKey` only                   |
| 19  | Managing cart state in component `useState`                   | Cart resets on page navigation                            | Use global Zustand `useCartStore` with visitor ID                    |
| 20  | Using `npm install` or committing `package-lock.json`         | Breaks Yarn workspace lockfile consistency                | Use `yarn add` and commit `yarn.lock` only                           |

---

## Step 4: Standardized Verification Report Format

When reporting audit findings, use this exact Markdown structure:

```markdown
## Code Verification Audit Report

### 1. Scope & Categorization

- **Files Modified/Created**: `...`
- **Architectural Categories**: `...`

### 2. Universal Blocking Checks

- [x] TypeScript Strictness (Zero `any`)
- [x] Theme & Palette Invariants (Semantic tokens only)
- [x] Multi-Tenant Store Context (Proper `resolveRequestStore` usage)
- [x] Bilingual Key Parity (`en.json` == `ar.json`)
- [x] RTL & Logical Properties (`ps-`, `pe-`, `start-`, `rtl:rotate-180`)
- [x] Security & XSS (DOMPurify, `serializeJsonLd`)
- [x] API Client & Error Handling (`apiClient`, `endpoints`, `*WithErrorHandling`)

### 3. Anti-Pattern Scan Results

- **Anti-Patterns Detected**: 0
- **Status**: PASSED / READY TO SHIP
```
