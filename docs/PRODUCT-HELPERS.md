# Product Helpers Utility

## Overview
Centralized utility functions for product-related operations across the storefront. All functions are pure, reusable, and well-tested patterns.

## Location
`src/features/store/utils/product-helpers.ts`

## Functions

### Image Utilities

#### `getPrimaryImage(product)`
Returns the primary image or first available image from a product.

```typescript
const primaryImage = getPrimaryImage(product);
```

#### `sortProductImages(images)`
Sorts images with primary first, then by sortOrder.

```typescript
const sortedImages = sortProductImages(product.images);
```

### Variant Utilities

#### `getCheapestVariant(variants)`
Returns the variant with the lowest selling price.

```typescript
const cheapest = getCheapestVariant(product.variants);
```

#### `getMostExpensiveVariant(variants)`
Returns the variant with the highest selling price.

```typescript
const mostExpensive = getMostExpensiveVariant(product.variants);
```

#### `findVariantById(variants, variantId)`
Finds a specific variant by its ID.

```typescript
const selectedVariant = findVariantById(product.variants, variantId);
```

### Stock Utilities

#### `isProductInStock(product)`
Checks if any variant is in stock.

```typescript
const inStock = isProductInStock(product);
```

#### `getTotalAvailableQuantity(variants)`
Returns total quantity across all variants.

```typescript
const totalQty = getTotalAvailableQuantity(product.variants);
```

#### `getInStockVariants(variants)`
Filters and returns only in-stock variants.

```typescript
const availableVariants = getInStockVariants(product.variants);
```

#### `getOutOfStockVariants(variants)`
Filters and returns only out-of-stock variants.

```typescript
const unavailableVariants = getOutOfStockVariants(product.variants);
```

### Price Utilities

#### `formatProductPrice(product, currency, locale)`
Formats product price or price range for display. Handles:
- Single variant: single price
- Multiple variants (same price): single price
- Multiple variants (different prices): price range

```typescript
const priceDisplay = formatProductPrice(product, 'EGP', 'ar');
// Returns: "١٠٠٫٠٠ ج.م." or "١٠٠٫٠٠ ج.م. - ٢٠٠٫٠٠ ج.م."
```

#### `getPriceRange(variants)`
Returns min and max price values.

```typescript
const range = getPriceRange(product.variants);
// Returns: { min: 100, max: 200 }
```

#### `hasVariedPricing(product)`
Checks if product has multiple price points.

```typescript
const hasVariedPrices = hasVariedPricing(product);
```

## Usage Examples

### Product Card Component
```typescript
import { getPrimaryImage, isProductInStock, formatProductPrice } from '../utils/product-helpers';

export function ProductCard({ product, currency, locale }) {
  const primaryImage = getPrimaryImage(product);
  const inStock = isProductInStock(product);
  const priceDisplay = formatProductPrice(product, currency, locale);
  
  return (
    <div>
      {primaryImage && <img src={primaryImage.imageUrl} />}
      <p>{priceDisplay}</p>
      {!inStock && <span>Out of Stock</span>}
    </div>
  );
}
```

### Product Details Component
```typescript
import { sortProductImages, findVariantById } from '../utils/product-helpers';

export function ProductDetails({ product }) {
  const sortedImages = sortProductImages(product.images);
  const selectedVariant = findVariantById(product.variants, selectedVariantId);
  
  return (
    <div>
      {sortedImages.map(img => <img key={img.imageUrl} src={img.imageUrl} />)}
      <p>Price: {selectedVariant?.sellingPrice}</p>
    </div>
  );
}
```

## Benefits

1. **DRY Principle**: Eliminates code duplication across components
2. **Consistency**: Same logic used everywhere ensures consistent behavior
3. **Maintainability**: Update logic in one place
4. **Testability**: Pure functions easy to unit test
5. **Type Safety**: Full TypeScript support
6. **Performance**: No unnecessary recalculations

## Future Enhancements

Consider adding:
- `getVariantByAttributes()` - Find variant by color, size, etc.
- `calculateDiscountedPrice()` - For sales/promotions
- `getProductRating()` - When reviews are added
- `getRelatedProducts()` - For recommendations
