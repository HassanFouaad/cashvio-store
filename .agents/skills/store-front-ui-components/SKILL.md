---
name: store-front-ui-components
description: CVA buttons, inputs, selects, bottom sheet modals (Vaul), skeleton loaders, and responsive mobile navigation
---

# UI Primitives & Component Layer

How to use and build UI primitives with Class Variance Authority (CVA), manage responsive form inputs, render accessible bottom sheets with Vaul, and build skeleton loaders.

## When to Use

- Creating or editing reusable primitives in `src/components/ui/`.
- Building interactive modal sheets, action bars, or quantity pickers.
- Creating skeleton placeholders for route loading states.

## Core Rules & Invariants

1. **Tailwind v4 Semantic Classes**: All UI primitives must use semantic theme variables (`bg-primary`, `border-input`, `text-foreground`).
2. **CVA for Variant Switching**: Use `class-variance-authority` for primitives that support multiple visual variants and sizes (`Button`).
3. **Accessibility**: All interactive elements must have translated `aria-label` or accessible text.
4. **Mobile Responsiveness**: Provide smooth bottom-sheet modals on mobile (`vaul`) and standard dialogs on desktop.

## Step-by-Step Implementation Flow

### Step 1: Button Primitive with CVA

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "sf-btn-primary bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
```

### Step 2: Skeleton Loader Primitive

```tsx
import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
```

### Step 3: Product Card Skeleton for PLP Loading State

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="sf-panel rounded-xl overflow-hidden border border-border bg-card p-3 space-y-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Non-standard button without CVA or semantic variables
<button className="bg-green-600 text-white p-2 rounded">Submit</button>

// ✅ REQUIRED — Reusable CVA Button with semantic token
<Button variant="default" size="default">Submit</Button>
```
