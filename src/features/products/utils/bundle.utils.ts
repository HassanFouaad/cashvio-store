import { PublicBundleComponentDto } from "@/features/products/types/product-bundle.types";
import {
  PublicProductDto,
  PublicProductVariantDto,
} from "@/features/products/types/product.types";

export class BundleUtils {
  static isBundleVariant(variant: PublicProductVariantDto): boolean {
    return variant.bundle?.isBundle === true;
  }

  static isProductBundle(product: PublicProductDto): boolean {
    return (product.variants ?? []).some((variant) =>
      BundleUtils.isBundleVariant(variant),
    );
  }

  static getBundleComponents(
    variant: PublicProductVariantDto,
  ): PublicBundleComponentDto[] {
    return variant.bundle?.components ?? [];
  }

  static getBundleSavings(variant: PublicProductVariantDto): number | null {
    // Deliberately differs from tenant-portal getBundleSavings: storefront uses
    // sellingPrice (post-discount effective price) so savings reflect what the
    // shopper pays today; portal uses getVariantBaseSellingPrice (pre-discount
    // base) so merchant drift banners reflect the authored bundle price.
    const componentsSumPrice = variant.bundle?.componentsSumPrice;
    if (componentsSumPrice == null || componentsSumPrice <= variant.sellingPrice) {
      return null;
    }

    return componentsSumPrice - variant.sellingPrice;
  }

  static getBundleItemCount(variant: PublicProductVariantDto): number {
    return variant.bundle?.componentCount ?? 0;
  }

  /**
   * Unlimited when the backend resolver sets isUnlimited on the bundle payload.
   * Simple products: inventoryTrackable false means unlimited.
   */
  static isUnlimitedStock(variant: PublicProductVariantDto): boolean {
    if (BundleUtils.isBundleVariant(variant)) {
      return variant.bundle?.isUnlimited === true;
    }

    return variant.inventoryTrackable === false;
  }

  static getEffectiveAvailableQuantity(
    variant: PublicProductVariantDto,
  ): number | null {
    if (BundleUtils.isUnlimitedStock(variant)) {
      return null;
    }

    return variant.availableQuantity ?? 0;
  }
}
