---
name: store-front-rtl-styling
description: Tailwind CSS v4 logical properties, RTL icon rotation, bidirectional typography, and horizontal alignment rules
---

# RTL Styling & Bidirectional Layouts

How to write Tailwind CSS v4 styles that seamlessly render in both Arabic (RTL) and English (LTR) using logical properties and directional icon rotations.

## When to Use
- Writing any component with padding, margin, borders, or positioning.
- Rendering icons with intrinsic directional meaning (chevrons, back arrows, next buttons).
- Handling input alignments, badge placements, or floating action buttons.

## Core Rules & Invariants
1. **Exclusively Use Logical Properties**: Never use physical directional utilities (`pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right`).
2. **Directional Icon Flipping**: Any chevron, arrow, or progression indicator MUST include `rtl:rotate-180` to point correctly in Arabic.
3. **Input Alignment**: Form inputs and placeholders must use `text-start`.

## Logical Properties Mapping Table

| Physical Utility (FORBIDDEN) | Logical Utility (REQUIRED) | CSS Property |
|---|---|---|
| `pl-4` | `ps-4` | `padding-inline-start` |
| `pr-4` | `pe-4` | `padding-inline-end` |
| `ml-2` | `ms-2` | `margin-inline-start` |
| `mr-2` | `me-2` | `margin-inline-end` |
| `left-0` | `start-0` | `inset-inline-start` |
| `right-0` | `end-0` | `inset-inline-end` |
| `text-left` | `text-start` | `text-align: start` |
| `text-right` | `text-end` | `text-align: end` |
| `border-l` | `border-s` | `border-inline-start` |
| `border-r` | `border-e` | `border-inline-end` |
| `rounded-l` | `rounded-s` | `border-start-start-radius`, `border-end-start-radius` |
| `rounded-r` | `rounded-e` | `border-start-end-radius`, `border-end-end-radius` |

## Step-by-Step Implementation Flow

### Step 1: Directional Layout with Icons
```tsx
import { ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackNavigationHeader({ href, title }: { href: string; title: string }) {
  return (
    <div className="flex items-center gap-3 py-4 ps-2 pe-4 border-b border-border">
      <Link
        href={href}
        className="p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
      </Link>
      <h1 className="text-lg font-bold text-foreground text-start">{title}</h1>
    </div>
  );
}
```

### Step 2: Floating Action Button with Start/End Placement
```tsx
import { MessageCircle } from "lucide-react";

export function WhatsAppFab({ phone }: { phone: string }) {
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 end-6 z-50 p-4 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Physical left/right breaks completely in Arabic
<div className="pl-6 pr-2 text-left absolute left-4">
  <span>Back</span>
  <ChevronRight className="h-4 w-4" />
</div>

// ✅ REQUIRED — Logical properties and RTL icon rotation
<div className="ps-6 pe-2 text-start absolute start-4">
  <span>Back</span>
  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
</div>
```
