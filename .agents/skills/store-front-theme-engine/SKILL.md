---
name: store-front-theme-engine
description: Dynamic theme palettes, CSS variable injection, font presets, structural attributes (data-sf-*), and PDP theme variants
---

# Merchant Theme Engine & Dynamic Styling

How to work with the multi-tenant theme engine, inject dynamic CSS variables, manage structural `data-sf-*` attributes, and implement PDP layout variants.

## When to Use
- Implementing UI components that consume merchant brand colors or layout attributes.
- Adding or modifying theme presets, font pairings, or custom palette derivation.
- Handling theme preview query parameters (`?sf_theme_preview=...`).
- Rendering PDP theme variants (`DEFAULT`, `MINIMAL`, `MODERN`, `SHOWCASE`).

## Core Rules & Invariants
1. **Zero Hardcoded Colors**: Components must NEVER use hardcoded hex codes (`#059669`) or arbitrary Tailwind colors (`bg-[#10b981]`). Always use semantic Tailwind tokens (`bg-primary`, `text-primary-foreground`, `bg-card`, `border-border`).
2. **19-Token CSS Contract**: All theme colors are injected dynamically into `<style id="sf-theme-vars">` via `buildThemeStyle(resolvedTheme)` in `src/app/layout.tsx`.
3. **Structural Attributes**: The root `<html>` tag dynamically receives `data-sf-theme`, `data-sf-buttons`, `data-sf-icons`, `data-sf-type`, and `data-sf-order-pages`.
4. **Theme Classes**: Use `.sf-panel` for bounded cards, `.sf-price` for formatted amounts, `.sf-btn-primary` for action buttons, and `.sf-img-zoom` for card image hover effects.

## Step-by-Step Implementation Flow

### Step 1: Resolving and Injecting Theme in Root Layout
```tsx
import { resolveRequestTheme } from "@/lib/theme/resolve-theme";
import { buildThemeStyle } from "@/lib/theme/build-theme-style";
import { getThemeFontConfig } from "@/lib/theme/fonts";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { store } = await resolveRequestStore();
  const theme = await resolveRequestTheme(store);
  const themeStyle = buildThemeStyle(theme);
  const fontConfig = getThemeFontConfig(theme.fontPreset);

  return (
    <html
      lang={locale}
      dir={direction}
      data-sf-theme={theme.preset}
      data-sf-buttons={theme.buttonStyle}
      data-sf-icons={theme.iconStyle}
      data-sf-type={theme.typographyStyle}
      data-sf-order-pages={theme.orderPageStyle}
      className={fontConfig.variableClass}
    >
      <head>
        <style id="sf-theme-vars" dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body className={fontConfig.fontFamilyClass}>
        {children}
      </body>
    </html>
  );
}
```

### Step 2: Styling Components with Semantic Tokens
```tsx
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface ActionCardProps {
  title: string;
  price: string;
  onAction: () => void;
}

export function ActionCard({ title, price, onAction }: ActionCardProps) {
  return (
    <div className="sf-panel p-6 space-y-4 bg-card text-card-foreground border-border">
      <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      <div className="sf-price text-xl font-bold text-primary">{price}</div>
      <Button variant="default" size="lg" className="w-full" onClick={onAction}>
        Add to Cart
      </Button>
    </div>
  );
}
```

### Step 3: Handling PDP Layout Variants
```tsx
import { StoreFrontThemeProductPageVariant } from "@/features/store/types/store.types";

interface ProductViewProps {
  product: PublicProductDto;
  variant: StoreFrontThemeProductPageVariant;
}

export function ProductView({ product, variant }: ProductViewProps) {
  switch (variant) {
    case StoreFrontThemeProductPageVariant.MINIMAL:
      return <MinimalProductLayout product={product} />;
    case StoreFrontThemeProductPageVariant.MODERN:
      return <ModernStickyProductLayout product={product} />;
    case StoreFrontThemeProductPageVariant.SHOWCASE:
      return <ShowcaseEditorialProductLayout product={product} />;
    case StoreFrontThemeProductPageVariant.DEFAULT:
    default:
      return <StandardGridProductLayout product={product} />;
  }
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Hardcoding fixed emerald hex in buttons and text
<div className="bg-[#111d17] border border-[#24352c] rounded-xl p-4">
  <span className="text-[#059669] font-bold">120 EGP</span>
  <button className="bg-[#059669] hover:bg-[#047857] text-white">Buy</button>
</div>

// ✅ REQUIRED — Semantic theme tokens and utility classes
<div className="sf-panel bg-card text-card-foreground border-border rounded-xl p-4">
  <span className="sf-price text-primary font-bold">{formatCurrency(120, "EGP", locale)}</span>
  <Button variant="default">Buy</Button>
</div>
```
