---
name: store-front-seo-and-metadata
description: generateMetadata, OpenGraph, Twitter cards, hreflang alternates, JSON-LD schemas, and XSS-safe serialization
---

# SEO & Metadata Architecture

How to implement dynamic Next.js App Router metadata, generate OpenGraph and Twitter cards, configure hreflang language alternates, and safely serialize structured JSON-LD schemas.

## When to Use
- Adding or updating `generateMetadata` on any page (`/`, `/products/[id]`, `/categories/[id]`, `/pages/[slug]`).
- Adding JSON-LD structured data (`Product`, `Store`, `BreadcrumbList`, `WebPage`).
- Configuring OpenGraph images, social previews, and canonical URLs.

## Core Rules & Invariants
1. **Dynamic Store Context**: All metadata must resolve the store via `resolveRequestStore()` and use store branding, logo, and title formatting.
2. **Hreflang Language Alternates**: Pages must provide `languages: { 'en': '?lang=en', 'ar': '?lang=ar', 'x-default': canonicalPath }`.
3. **Safe JSON-LD Serialization (CRITICAL)**: Always serialize schema objects using `serializeJsonLd()` from `src/lib/utils/json-ld.ts`. Never use raw `JSON.stringify()`.
4. **No Double Branding**: If `store.name` is appended by a template or utility, do not hardcode it twice in page titles.

## Step-by-Step Implementation Flow

### Step 1: Implementing `generateMetadata`
```typescript
import { Metadata } from "next";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { getProductByIdWithErrorHandling } from "@/features/products/actions/get-products";
import { buildPageMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { store } = await resolveRequestStore();
  const { id } = await params;
  const { product } = await getProductByIdWithErrorHandling(id);

  if (!product || !store) {
    return { title: "Product Not Found" };
  }

  return buildPageMetadata({
    title: product.name,
    description: product.description || `${product.name} from ${store.name}`,
    image: product.images?.[0]?.url || store.logoUrl,
    store,
    path: `/products/${product.id}`,
  });
}
```

### Step 2: Product JSON-LD Schema Generation
```typescript
import { PublicProductDto } from "@/features/products/types/product.types";
import { PublicStoreDto } from "@/features/store/types/store.types";
import { serializeJsonLd } from "@/lib/utils/json-ld";

export function buildProductJsonLd(product: PublicProductDto, store: PublicStoreDto) {
  const defaultVariant = product.variants?.[0];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.map((img) => img.url) || [],
    sku: defaultVariant?.sku || product.id,
    offers: {
      "@type": "Offer",
      price: defaultVariant?.price || 0,
      priceCurrency: store.currency || "EGP",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: store.name,
      },
    },
  };
}
```

### Step 3: Injecting JSON-LD Script in Server Component
```tsx
export default async function ProductPage({ params }: PageProps) {
  const { store } = await resolveRequestStore();
  const { id } = await params;
  const { product } = await getProductByIdWithErrorHandling(id);

  if (!product || !store) notFound();

  const jsonLd = buildProductJsonLd(product, store);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ProductDetails product={product} store={store} />
    </>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Raw JSON.stringify in script tag allows script injection XSS
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
/>

// ✅ REQUIRED — Sanitized and escaped JSON-LD serialization
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
/>
```
