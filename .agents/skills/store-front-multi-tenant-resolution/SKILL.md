---
name: store-front-multi-tenant-resolution
description: Host/subdomain resolution through proxy.ts, request-bound store and locale context, and active storefront enforcement.
---

# Resolve storefront request context

Use for server pages, layouts, metadata, hostname routing, preview headers and store-scoped API queries.

## Sources to read

- `src/proxy.ts`: hostname checks, locale selection and preview forwarding.
- `src/features/store/utils/store-resolver.ts`: subdomain parsing and reserved names.
- `src/lib/api/resolve-request-store.ts`: per-request store lookup and API context binding.
- `src/app/layout.tsx`: active-store gating and server/client context wiring.
- `src/app/products/[id]/page.tsx`: established page and metadata implementation.

## Required flow

1. Resolve the current request with `resolveRequestStore()` before store-scoped resource calls. Handle missing/invalid/inactive stores using the existing errors and `notFound()` where appropriate.
2. The bootstrap store lookup establishes the ID; subsequent `apiClient` requests receive `X-Store-Id` when context is available. Explicit global/lookup endpoints need their own backend contract. A header is never an authentication grant.
3. The resolver also sets the request locale, including client navigations where the layout does not rerun. Do not replace this with process-global state.
4. Use the existing endpoint catalog and API fetchers, not raw fetch or invented `features/*/actions` paths.
5. `React.cache()` deduplicates within a request only. Do not introduce cross-request merchant/store caching without approved invalidation and isolation semantics.
6. Reuse page-local metadata helpers and `buildLanguageAlternates` from `src/lib/utils`; there is no shared `src/lib/seo/metadata.ts` builder.
7. Client code obtains context through the established `StoreProvider` APIs. Preserve the merchant's locale/theme and backend scope validation.

## Verification

Run the relevant local checks and the Cashvio task's host/store/locale browser and API cases. Include missing/reserved subdomains, inactive stores, navigation, en/ar and cross-store isolation. A valid header or build is not end-to-end authority evidence.
