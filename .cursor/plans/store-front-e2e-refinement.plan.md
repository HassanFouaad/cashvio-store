# Store-Front End-to-End Refinement Plan

Full audit of store-front + backend public API + portal management found 7 critical issues, ~25 UX/conversion gaps, ~20 non-unified code patterns, and a set of world-class feature gaps. Phases are ordered by impact; each is independently shippable.

## Phase 0 — Critical bugs and security (fix first, small diffs)

**Store-front**

- Product title never renders: unclosed JSX comment swallows the `<h1>` block — one-line fix in `src/features/products/components/product-details.tsx` line 73 (`{/* Product Title}` missing `*/`).
- INACTIVE storefronts are fully browsable and purchasable: `storeFront.status` is only checked in `generateMetadata`. Gate the body in `src/app/layout.tsx` (line ~208) with the existing "store unavailable" error component.
- Stored-XSS window: `src/components/ui/safe-html-renderer.tsx` returns raw HTML during SSR (lines 27-30) — sanitize server-side (isomorphic-dompurify). Also escape `<` in all JSON-LD `JSON.stringify` injections (home, product page).
- `hideOutOfStock` tenant setting is dead end-to-end: storefront never reads it AND backend `findPublicProducts` never applies it (`be/src/modules/products/repositories/products.repository.ts` L45-109 vs the supported filter at L278-301). Wire it in the backend list query.

**Backend**

- Cross-tenant IDOR: `GET /v1/public/export/orders/:orderId` has no guard and no store/tenant scoping (`be/src/modules/orders/controllers/public.export.controller.ts`) — leaks any order's customer PII by UUID. Add `@PublicStore()` + scope the query to the store from context.
- Global `ValidationPipe` only registered when NOT production (`be/src/main.ts` L48-53) — move it out of the env check.
- Storefront checkout never validates stock (PENDING orders skip all inventory ops — `order-inventory.helper.ts` L190-196, preview never checks availability): add an availability check in public order preview/create (validate-only, no reservation system needed).
- Add `@nestjs/throttler` rate limits on public POSTs (orders, reviews, contact, carts, receipt-upload-url).

## Phase 1 — Journey speed and conversion

- Parallelize server fetches: home page awaits categories → products → special products sequentially (`src/app/page.tsx` L42-58); checkout awaits 4 calls (`src/app/checkout/page.tsx` L50-99). Use `Promise.all`.
- Cache the per-subdomain store lookup across requests (`unstable_cache`, revalidate ~60s) — currently every page view re-fetches store config due to `force-dynamic`.
- Add missing `loading.tsx` for `/` and `/products/[id]` (highest-traffic routes have no skeleton).
- Drop the duplicate reviews fetch on the product page (50-review JSON-LD fetch + separate 10-review UI fetch → one fetch).
- Checkout form hardening: wrap in a real `<form>` with `autocomplete="name"/"tel"`, inline "what's missing" messages instead of a silently disabled button, phone `defaultCountry` from `store.country` instead of hardcoded `"eg"`, AbortController/sequencing on preview calls, idempotency key header on order create (backend accepts + dedupes).
- Order tracking (dead-end fix): small public endpoint `GET /public/orders/track?orderNumber&phone` + `/track` page; make order-success refresh-safe (don't consume the token on first render) and show an order recap with copy-to-clipboard.
- Cart UX: confirmation dialog on "Clear all"; surface `removedVariantIds` (already returned by API, typed, never read); add-to-cart feedback beyond the badge (toast/mini-drawer with "view cart").

## Phase 2 — De-AI the design + tenant branding

- Tenant brand color: add a single `primaryColor` to StoreFront (migration + portal color picker in Appearance tab + storefront injects it as the `--color-primary` oklch/hex CSS variable in layout). One field, no theme engine — stores stop all looking identical.
- Fix the 64px phantom gap: `mt-16` on `src/features/store/components/store-hero.tsx` L57 (header is sticky, not fixed).
- Replace generic empty-state copy ("Coming Soon / Stay Tuned" chips) in `src/features/store/components/store-empty-state.tsx`; delete stale `landing.*` i18n namespace and unused keys.
- Fix hallucinated Tailwind classes: `bg-gradient-to-e/s` (invalid) and no-op `scrollbar-thin` in `src/features/categories/components/categories-section.tsx` L39,53-54; remove dead "mobile native" CSS (`.touch-feedback`, `.fixed-bottom-cta`, etc.) or wire them.
- Sticky mobile add-to-cart bar on product detail (CSS for it already exists, unused).

## Phase 3 — RTL/i18n/a11y polish (Arabic is the default locale)

- Translate all ~19 hardcoded English aria-labels/strings (add-to-cart controls, hero, gallery, search, phone-input placeholders "Search countries...", cart-summary "+N more").
- Fix RTL-broken primitives: `src/components/ui/select.tsx` (`pr-8`/`right-2.5` — the checkout country/city picker) and `src/components/common/search-input.tsx` (physical `left/right` padding) → logical properties; unify the two search implementations into one component.
- Align locale defaults: middleware defaults Arabic, `i18n/request.ts` + API context default English — pick one.
- Fix review date formatting to use request locale; fix the `t("searchPlaceholder").split("...")` hack and the wrong mobile filter close-button label.

## Phase 4 — Discovery, SEO, and trust

- Header search icon (desktop) + Products/search in mobile bottom nav (catalog is currently unreachable from mobile primary nav); category filter on `/products`.
- SEO: canonicals on list/category/home pages, `hreflang`/`og:locale`, BreadcrumbList JSON-LD, fix `reviewCount`/average to use pagination totals, sitemap locale + real `lastmod`.
- Trust at checkout: policy links near Place Order, payment-method icons in footer, WhatsApp contact option (socialMedia model already has contactPhone — expose in portal form too).

## Phase 5 — Coupons online (plumbing exists, currently dead)

- Backend: map `couponCode` through public preview + create mappers (`be/src/modules/orders/mapper/public-order-dto.mapper.ts` drops it today; preview DTO lacks the field), and call the existing-but-never-invoked `couponUsageService.recordUsage` on order creation.
- Store-front: promo code field in checkout summary showing discount from preview.
- Portal already has full coupon management — no new UI needed.

## Phase 6 — Code unification and dead-weight removal

- One visitor-ID module (three implementations today cause first-visit cart orphaning: middleware cookie vs cart localStorage vs visitor provider).
- Send real currency in `add_to_cart`/`remove_from_cart` analytics (currently `currency: ''`).
- Remove or adopt React Query (mounted, zero usages) + remove unused deps (`react-hook-form`, `zod`, `@hookform/resolvers`, `uuid`) or adopt them in checkout; delete dead helpers/exports/empty `order-export` feature dirs; single `sf_store_id` constant (4 copies); dedupe error-parsing in the API client; remove `'use server'` from read-only API functions; fix env config dynamic `process.env[key]` reads (dead on client).
- Backend hygiene: remove leftover `console.log` in order creation, fix zero-fee delivery-zone cache miss (`if (cachedValue)` treats 0 as miss), min-order-value should compare subtotal not fees-inclusive total.

## Portal quick wins (already modeled, just hidden)

- Expose `contactPhone` in the Social section form, payment-method `additionalFee` config, the two DTO-defined-but-hidden static page slugs (terms/privacy), hero image drag re-ordering (dnd-kit already used one section below).

## Explicitly deferred (big modules — flag only, don't build now)

Online payment gateway, customer accounts/OTP login, abandoned-cart recovery, wishlist, related-products engine, custom domains, webhooks, WhatsApp order notifications. These are the remaining competitive gaps vs Shopify/Salla/Zid but each is a real project; recommend gateway + order-confirmation flow as the next roadmap items after this plan.

---

## Todo checklist

- [ ] Phase 0 storefront: fix product-title JSX comment bug, gate INACTIVE stores, SSR-sanitize SafeHtmlRenderer + escape JSON-LD
- [ ] Phase 0 backend: guard+scope public order export, enable ValidationPipe in production, stock validation on storefront checkout, throttle public POSTs, apply hideOutOfStock
- [ ] Phase 1: parallelize home/checkout fetches, cache store lookup, add loading.tsx for home + product detail, dedupe reviews fetch
- [ ] Phase 1: real form + autocomplete + inline validation, preview abort/sequencing, idempotency key, store-country phone default
- [ ] Phase 1: public track-order endpoint + /track page, refresh-safe order-success with recap
- [ ] Phase 1: clear-all confirmation, surface removedVariantIds, add-to-cart toast/mini-cart feedback
- [ ] Phase 2: tenant primaryColor (migration + portal picker + storefront CSS var), fix hero gap, empty-state copy, invalid Tailwind classes, sticky mobile CTA
- [ ] Phase 3: translate hardcoded aria-labels/strings, fix select/search-input RTL, unify search components, align locale defaults
- [ ] Phase 4: header/mobile search + category filter, canonicals/hreflang/BreadcrumbList, checkout policy links, WhatsApp contact
- [ ] Phase 5: wire couponCode through public mappers + record usage, checkout promo field
- [ ] Phase 6: single visitor-ID module, analytics currency fix, remove/adopt dead deps + dead code, backend hygiene fixes
- [ ] Portal: expose contactPhone, additionalFee, hidden static-page slugs, hero image reordering
