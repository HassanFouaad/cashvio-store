---
name: store-front-cart-management
description: Zustand cart store, visitor ID persistence, optimistic updates, modifier selections, debounced server sync, and stock validation
---

# Cart Management & Zustand Store

How to manage shopping cart state using Zustand, handle guest visitor ID persistence, validate modifier groups and variant stock, and debounce server synchronization.

## When to Use
- Adding items to the cart from PDP or quick-add buttons.
- Modifying quantities, removing items, or clearing the cart.
- Synchronizing local cart state with the backend `/public/carts/items` API.
- Validating stock limits and modifier selections before cart insertion.

## Core Rules & Invariants
1. **Visitor ID is the Session Key**: Guest carts use `getOrCreateVisitorId()` (UUID stored in cookie and `localStorage`).
2. **Debounced Server Sync**: Local Zustand state updates optimistically; backend synchronization debounces by 300ms to avoid network storms on rapid quantity clicks.
3. **Cart Structure**: Each cart item is uniquely identified by combining `variantId` and sorted modifier option IDs.
4. **Stock Validation**: Never exceed `variant.availableQuantity`. If `availableQuantity <= 0`, disable add to cart.
5. **Item Quantity Limits**: Single line items have a max limit (default: 50 items).

## Step-by-Step Implementation Flow

### Step 1: Reading Cart State in Client Components
```tsx
"use client";

import { useCartStore } from "@/features/cart/store/cart-store";
import { formatCurrency } from "@/lib/utils/formatters";

export function CartSummaryBadge() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getSubtotal());

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold">{itemCount} items</span>
      <span className="text-primary">{formatCurrency(subtotal, "EGP", "ar")}</span>
    </div>
  );
}
```

### Step 2: Adding a Configured Product to Cart
```tsx
"use client";

import { useCartStore } from "@/features/cart/store/cart-store";
import { PublicProductDto, PublicProductVariantDto, SelectedModifierOption } from "@/features/products/types/product.types";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  product: PublicProductDto;
  variant: PublicProductVariantDto;
  quantity: number;
  selectedModifiers: SelectedModifierOption[];
}

export function AddToCartButton({ product, variant, quantity, selectedModifiers }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0]?.url || "",
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku,
      unitPrice: variant.price,
      quantity,
      maxQuantity: variant.availableQuantity,
      selectedModifiers,
    });
  };

  return (
    <Button
      variant="default"
      size="lg"
      className="w-full"
      disabled={variant.availableQuantity <= 0}
      onClick={handleAdd}
    >
      {variant.availableQuantity > 0 ? "Add to Cart" : "Out of Stock"}
    </Button>
  );
}
```

### Step 3: Quantity Controls with Bounds Checking
```tsx
"use client";

import { useCartStore } from "@/features/cart/store/cart-store";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div>
        <h4 className="font-medium text-foreground">{item.productName}</h4>
        <p className="text-sm text-muted-foreground">{item.variantName}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Decrease quantity"
          onClick={() => {
            if (item.quantity === 1) removeItem(item.id);
            else updateQuantity(item.id, item.quantity - 1);
          }}
        >
          {item.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </Button>

        <span className="w-8 text-center font-bold">{item.quantity}</span>

        <Button
          variant="outline"
          size="icon"
          aria-label="Increase quantity"
          disabled={item.quantity >= item.maxQuantity}
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```typescript
// ❌ FORBIDDEN — Managing cart in local component state without visitor ID or sync
export function BadCart() {
  const [items, setItems] = useState([]);
  const add = (p) => setItems([...items, p]); // Disappears on navigation!
}

// ✅ REQUIRED — Global Zustand store backed by persistent visitor ID
import { useCartStore } from "@/features/cart/store/cart-store";
export function GoodCart() {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
}
```
