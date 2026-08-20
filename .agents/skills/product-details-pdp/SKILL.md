---
name: product-details-pdp
description: Product Details Page (PDP) layout variants, variant matrix, modifier groups, image galleries, and Product JSON-LD schema
---

# Product Details Page (PDP) Architecture

How to build and maintain the Product Details Page (PDP), implement variant selection matrices, handle required and optional modifier groups, render responsive image galleries, and inject rich schema metadata.

## When to Use
- Implementing or modifying `/products/[id]/page.tsx` or `src/features/products/`.
- Building variant selectors (color, size, material) with price and inventory updates.
- Implementing modifier groups (radio single-select vs checkbox multi-select).
- Supporting PDP layout variants (`DEFAULT`, `MINIMAL`, `MODERN`, `SHOWCASE`).

## Core Rules & Invariants
1. **Active/InStock Checks**: If `!product.inStock` or `availableQuantity <= 0`, disable purchase actions and display an "Out of Stock" badge.
2. **Variant Price Dynamic Sync**: Selecting a variant updates the displayed price, SKU, and maximum selectable quantity.
3. **Modifier Validation**:
   - Single-choice groups (`minSelection === 1 && maxSelection === 1`): Radio behavior, required.
   - Multi-choice groups (`maxSelection > 1`): Checkboxes, validate bounds `[minSelection, maxSelection]`.
4. **Structured Data**: Inject valid `Product` and `BreadcrumbList` JSON-LD schemas via `serializeJsonLd()` from `src/lib/utils/json-ld.ts`.

## Step-by-Step Implementation Flow

### Step 1: Server Component Setup & Metadata
```tsx
import { notFound } from "next/navigation";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { getProductByIdWithErrorHandling } from "@/features/products/actions/get-products";
import { ProductDetails } from "@/features/products/components/product-details";
import { buildProductJsonLd, serializeJsonLd } from "@/lib/utils/json-ld";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { store } = await resolveRequestStore();
  const { id } = await params;
  const { product, error } = await getProductByIdWithErrorHandling(id);

  if (error || !product || !store) {
    notFound();
  }

  const jsonLd = buildProductJsonLd(product, store);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main className="container mx-auto px-4 py-8">
        <ProductDetails product={product} store={store} />
      </main>
    </>
  );
}
```

### Step 2: Variant Matrix Selection Logic
```tsx
"use client";

import { useState } from "react";
import { PublicProductDto, PublicProductVariantDto } from "../types/product.types";
import { cn } from "@/lib/utils/cn";

export function VariantSelector({
  product,
  selectedVariant,
  onSelectVariant,
}: {
  product: PublicProductDto;
  selectedVariant: PublicProductVariantDto;
  onSelectVariant: (v: PublicProductVariantDto) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Options</label>
      <div className="flex flex-wrap gap-2">
        {product.variants.map((v) => {
          const isSelected = v.id === selectedVariant.id;
          const isAvailable = v.availableQuantity > 0;

          return (
            <button
              key={v.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectVariant(v)}
              className={cn(
                "px-4 py-2 text-sm rounded-md border transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-input bg-background hover:bg-muted text-foreground",
                !isAvailable && "opacity-40 cursor-not-allowed line-through"
              )}
            >
              {v.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Step 3: Modifier Groups Picker
```tsx
export function ModifierGroupPicker({
  group,
  selectedOptions,
  onChange,
}: {
  group: ProductModifierGroupDto;
  selectedOptions: string[];
  onChange: (options: string[]) => void;
}) {
  const isSingle = group.minSelection === 1 && group.maxSelection === 1;

  const handleToggle = (optionId: string) => {
    if (isSingle) {
      onChange([optionId]);
    } else {
      if (selectedOptions.includes(optionId)) {
        onChange(selectedOptions.filter((id) => id !== optionId));
      } else if (selectedOptions.length < group.maxSelection) {
        onChange([...selectedOptions, optionId]);
      }
    }
  };

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{group.name}</span>
        <span className="text-muted-foreground text-xs">
          {group.minSelection > 0 ? `Required (Choose ${group.minSelection})` : "Optional"}
        </span>
      </div>
      <div className="space-y-1">
        {group.options.map((opt) => (
          <label key={opt.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type={isSingle ? "radio" : "checkbox"}
                name={group.id}
                checked={selectedOptions.includes(opt.id)}
                onChange={() => handleToggle(opt.id)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-sm">{opt.name}</span>
            </div>
            {opt.price > 0 && (
              <span className="text-xs text-muted-foreground">+{opt.price} EGP</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Unsanitized JSON-LD injection
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(productJson) }}
/>

// ✅ REQUIRED — Escaped and safe JSON-LD serialization
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJson) }}
/>
```
