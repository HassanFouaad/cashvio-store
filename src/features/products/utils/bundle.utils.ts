import { PublicBundleComponentDto } from "@/features/products/types/product-bundle.types";
import {
  PublicProductDto,
  PublicProductVariantDto,
} from "@/features/products/types/product.types";

export class BundleUtils {
  static hasBundle(variant: PublicProductVariantDto): boolean {
    return variant.bundle?.isBundle === true;
  }

  static isProductBundle(product: PublicProductDto): boolean {
    return (product.variants ?? []).some((variant) => BundleUtils.hasBundle(variant));
  }

  static getBundleComponents(
    variant: PublicProductVariantDto,
  ): PublicBundleComponentDto[] {
    return variant.bundle?.components ?? [];
  }

  static getBundleSavings(variant: PublicProductVariantDto): number | null {
    // Mirror of tenant-portal getBundleSavings.ts — storefront uses sellingPrice
    // from the public variant; portal uses getVariantBaseSellingPrice with storeId.
    const componentsSumPrice = variant.bundle?.componentsSumPrice;
    if (componentsSumPrice == null || componentsSumPrice <= variant.sellingPrice) {
      return null;
    }

    return componentsSumPrice - variant.sellingPrice;
  }

  static formatComponentName(component: PublicBundleComponentDto): string {
    if (
      component.variantName.trim().length > 0 &&
      component.variantName !== component.productName
    ) {
      return `${component.productName} (${component.variantName})`;
    }

    return component.productName;
  }

  static getBundleItemCount(variant: PublicProductVariantDto): number {
    if (variant.bundle?.componentCount != null) {
      return variant.bundle.componentCount;
    }

    return BundleUtils.getBundleComponents(variant).reduce(
      (total, component) => total + component.quantity,
      0,
    );
  }

  /**
   * Unlimited when the backend resolver sets availableQuantity to null.
   * Bundles: inStock plus null quantity means all components are non-trackable.
   * Simple products: inventoryTrackable false means unlimited.
   */
  static isUnlimitedStock(variant: PublicProductVariantDto): boolean {
    if (BundleUtils.hasBundle(variant)) {
      return variant.inStock && variant.availableQuantity == null;
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
