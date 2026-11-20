# Cashvio shopper storefront

The public, white-label shopping component of the Cashvio project. Merchant stores are resolved from the request hostname, with flat App Router routes such as `/products`, `/cart`, `/checkout`, `/track` and `/payment/result`.

## Project workflow

Whole-Cashvio changes use one shared task agreement under `cashvio-workflow/tasks/`, including affected backend, merchant portal, admin, documentation and infrastructure slices. Read [AGENTS.md](AGENTS.md) and the relevant local skills before implementation. The searchable file inventory is [MAP.md](MAP.md).

## Toolchain and setup

Use the Node version in [.node-version](.node-version) and Yarn Classic pinned in [package.json](package.json). Commit only `yarn.lock`; do not introduce another package-manager lockfile.

```sh
yarn install --frozen-lockfile
yarn dev
```

Development listens on port **4000**. A registered synthetic/demo store subdomain can be opened as `http://demo.localhost:4000`; its hostname must resolve and the backend must recognize that subdomain. The apex hostname does not represent a merchant store. No demo tenant is provisioned by these commands.

`yarn start` runs `next start` after a build. Its production port comes from `PORT` or an explicit `-p` argument; the development port does not configure production automatically.

## API configuration and request scope

The base URL in [src/config/env.config.ts](src/config/env.config.ts) uses `NEXT_PUBLIC_API_URL`, then `NEXT_API_URL`, then the development fallback `http://localhost:3000/api/v1`. Set the actual proxy/API prefix for your environment; other Cashvio components may compose `/v1` differently.

[src/proxy.ts](src/proxy.ts) handles hostname and locale routing. [resolveRequestStore](src/lib/api/resolve-request-store.ts) performs the store lookup, then binds the store ID and locale to the current request. Use `apiClient` and its [endpoint catalog](src/lib/api/config.ts) for subsequent scoped queries. `X-Store-Id` is added when store context is available; the bootstrap lookup establishes that context rather than authenticating a shopper.

React `cache()` deduplicates lookups within a request, not across merchant requests. Backend cache invalidation owns lookup freshness. Server components use existing API fetchers; client shopping state uses the Zustand cart store, not React Query.

## UI and locale contracts

- Merchant light/dark palettes and semantic tokens determine appearance. Do not hardcode Cashvio brand colors into merchant components.
- English and Arabic messages live in the root `messages/` directory. Locale is selected through `?lang=`, store-scoped cookies and request language; routes have no `/en` or `/ar` segment.
- Use logical RTL spacing/positioning, translated accessible names, appropriate loading/error states and the existing primitives.
- Payment result pages reconcile authoritative order state; redirect query parameters are not settlement evidence.
- Guest tracking requires the documented order-number/phone contract. Receipt upload uses presigned storage rather than base64 order bodies.

## Verification

```sh
yarn quality:foundations
yarn test:theme
yarn test:shopping
yarn verify:ci
```

`verify:ci` checks foundation hygiene and the map, then lint, types, theme/shopping tests and the production build. Relevant browser, en/ar/RTL, payment and store-isolation acceptance still belongs in the shared task; a build is not browser evidence.

The foundation check inspects tracked filenames and direct script targets. It does not scan credential contents or certify production security.

## Maintain guidance

Application code is organized under `src/app/`, `src/features/`, `src/lib/`, `src/providers/` and `src/components/`. Follow the current reference implementations linked in the skills. Regenerate the file map with `yarn index:code`; check it with `yarn index:code:check`. Run `yarn prepare` after installing dependencies to set up the existing local hook.
