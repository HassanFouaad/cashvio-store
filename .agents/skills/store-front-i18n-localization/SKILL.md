---
name: store-front-i18n-localization
description: next-intl setup, bilingual key parity (en + ar), nested namespaces, language switching, and currency/date formatters
---

# Internationalization (i18n) & Localization

How to manage translations with `next-intl`, maintain strict JSON key parity between Arabic and English, use translation hooks, and format dates and monetary values.

## When to Use
- Adding user-facing text, labels, error messages, or metadata.
- Creating or editing keys in `messages/en.json` and `messages/ar.json`.
- Implementing language switcher components.
- Formatting currency, quantities, or dates.

## Core Rules & Invariants
1. **Bilingual Parity (CRITICAL)**: Any key added to `messages/en.json` MUST be added with the identical key hierarchy to `messages/ar.json`.
2. **Arabic is Default**: Arabic (`ar`) is the primary language. Layouts must default to RTL.
3. **Flat URL Routes**: Do NOT prefix URLs with `/ar` or `/en`. Locales are switched via cookies and `?lang=en|ar`.
4. **Intl Formatters**: Always use `formatCurrency(amount, currency, locale)` for all price representations.

## Step-by-Step Implementation Flow

### Step 1: Server Component Translations
```tsx
import { getTranslations } from "next-intl/server";

export async function HeroSection() {
  const t = await getTranslations("store");

  return (
    <section className="text-center py-12">
      <h1 className="text-3xl font-bold">{t("welcome")}</h1>
      <p className="text-muted-foreground">{t("browseCatalog")}</p>
    </section>
  );
}
```

### Step 2: Client Component Translations & Interpolation
```tsx
"use client";

import { useTranslations } from "next-intl";

export function CartSummary({ count, total }: { count: number; total: string }) {
  const t = useTranslations("cart");

  return (
    <div className="p-4 border rounded-lg">
      <h3>{t("summaryTitle")}</h3>
      <p>{t("itemCount", { count })}</p>
      <p>{t("totalAmount", { total })}</p>
    </div>
  );
}
```

### Step 3: Maintaining Translation Files
`messages/en.json`:
```json
{
  "cart": {
    "summaryTitle": "Order Summary",
    "itemCount": "{count, plural, =1 {1 item} other {# items}}",
    "totalAmount": "Total: {total}"
  }
}
```

`messages/ar.json`:
```json
{
  "cart": {
    "summaryTitle": "ملخص الطلب",
    "itemCount": "{count, plural, =1 {منتج واحد} =2 {منتجان} other {# منتجات}}",
    "totalAmount": "الإجمالي: {total}"
  }
}
```

### Step 4: Formatting Currency and Numbers
```typescript
import { formatCurrency } from "@/lib/utils/formatters";

// English
formatCurrency(120, "EGP", "en"); // "EGP 120.00"

// Arabic
formatCurrency(120, "EGP", "ar"); // "١٢٠٫٠٠ ج.م."
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Hardcoded text or manual string concatenation
<button>Add to Cart - {price} EGP</button>

// ✅ REQUIRED — next-intl with formatted currency
<Button>{t("addToCart")} - {formatCurrency(price, currency, locale)}</Button>
```
