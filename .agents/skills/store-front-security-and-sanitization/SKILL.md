---
name: store-front-security-and-sanitization
description: DOMPurify HTML sanitization, JSON-LD XSS escaping, payment callback verification, and guest order lookup privacy
---

# Security & Content Sanitization

How to sanitize merchant-provided HTML content with DOMPurify, protect JSON-LD from script injection, verify payment gateway redirects, and safeguard guest order tracking data.

## When to Use

- Rendering merchant rich text descriptions, terms of service, or policy pages.
- Serializing structured data into `<script type="application/ld+json">`.
- Handling third-party payment callbacks and redirects.
- Querying order details for guest customers.

## Core Rules & Invariants

1. **Always Sanitize HTML with DOMPurify**: Never render raw HTML with `dangerouslySetInnerHTML` without passing it through `SafeHtmlRenderer` or `DOMPurify.sanitize()`.
2. **JSON-LD Script Escaping**: Never serialize structured schemas with raw `JSON.stringify()`. Always use `serializeJsonLd()` from `src/lib/utils/json-ld.ts` to escape `</script>` tags.
3. **Never Trust Query Params for Payment Completion**: Third-party payment redirects on `/payment/result` must never mark an order as paid based on URL parameters. Always poll `/public/orders/track`.
4. **Two-Factor Guest Order Protection**: `/public/orders/track` must always require both `orderNumber` AND `phone` to prevent enumeration of order details.

## Step-by-Step Implementation Flow

### Step 1: Rendering Sanitized Merchant HTML

```tsx
import { SafeHtmlRenderer } from "@/components/ui/safe-html-renderer";

interface PageContentProps {
  htmlContent: string;
}

export function PageContent({ htmlContent }: PageContentProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <SafeHtmlRenderer html={htmlContent} />
    </div>
  );
}
```

### Step 2: Implementation of `SafeHtmlRenderer`

```tsx
"use client";

import DOMPurify from "isomorphic-dompurify";

export function SafeHtmlRenderer({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "br",
      "span",
      "blockquote",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style"],
  });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
```

### Step 3: Secure JSON-LD Serialization

```typescript
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Raw dangerous HTML injection
<div dangerouslySetInnerHTML={{ __html: product.description }} />

// ✅ REQUIRED — Sanitized renderer
<SafeHtmlRenderer html={product.description} />
```
