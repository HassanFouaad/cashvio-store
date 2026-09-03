import {
  PublicProductDto,
  PublicProductVariantDto,
} from "@/features/products/types/product.types";
import {
  ProductDiscountDto,
  ProductDiscountType,
} from "@/features/products/types/product-discount.types";
import { ProductDiscountBadgePick } from "@/features/products/types/product-discount-badge-pick.types";
import {
  OrderPreviewItem,
  OrderPreviewResponse,
} from "@/features/checkout/types/checkout.types";
import { formatCurrency } from "@/lib/utils/formatters";

export class CatalogueDiscountUtils {
  static hasProductDiscount(product: PublicProductDto): boolean {
    return (product.variants ?? []).some(
      (variant) => variant.discount != null,
    );
  }

  static hasVariantDiscount(variant: PublicProductVariantDto): boolean {
    return variant.discount != null;
  }

  static allVariantsDiscounted(product: PublicProductDto): boolean {
    const variants = product.variants ?? [];
    if (variants.length === 0) {
      return false;
    }
    return variants.every((variant) => variant.discount != null);
  }

  static shouldShowCardStrikeThrough(product: PublicProductDto): boolean {
    const variants = product.variants ?? [];
    if (variants.length <= 1) {
      return CatalogueDiscountUtils.hasProductDiscount(product);
    }
    return CatalogueDiscountUtils.allVariantsDiscounted(product);
  }

  static getVariantUnitSavings(variant: PublicProductVariantDto): number {
    if (!variant.discount) {
      return 0;
    }

    if (variant.discount.unitDiscount > 0) {
      return variant.discount.unitDiscount;
    }

    if (variant.originalSellingPrice == null) {
      return 0;
    }

    return Math.max(0, variant.originalSellingPrice - variant.sellingPrice);
  }

  static pickProductDiscountBadge(
    product: PublicProductDto,
  ): ProductDiscountBadgePick | null {
    const discounted = (product.variants ?? []).filter(
      (variant) => variant.discount != null,
    );
    if (discounted.length === 0) {
      return null;
    }

    const candidates = discounted.map((variant) => ({
      discount: variant.discount as ProductDiscountDto,
      savingsAmount: CatalogueDiscountUtils.getVariantUnitSavings(variant),
    }));

    const best = candidates.reduce((currentBest, candidate) =>
      candidate.savingsAmount > currentBest.savingsAmount ? candidate : currentBest,
    );

    const isPartialProduct =
      (product.variants?.length ?? 0) > 1 &&
      !CatalogueDiscountUtils.allVariantsDiscounted(product);

    return {
      discount: best.discount,
      savingsAmount: best.savingsAmount,
      isPartialProduct,
    };
  }

  static formatBadgeLabel(
    discount: ProductDiscountDto,
    t: (key: string, values?: Record<string, string | number>) => string,
    currency: string,
    locale: string,
    options?: {
      savingsAmount?: number;
      isPartialProduct?: boolean;
    },
  ): string {
    if (discount.type === ProductDiscountType.PERCENTAGE) {
      if (options?.isPartialProduct) {
        return t("store.products.discount.upToPercentOff", {
          percent: Math.round(discount.percentOff),
        });
      }

      return t("store.products.discount.percentOff", {
        percent: Math.round(discount.percentOff),
      });
    }

    const savingsAmount =
      options?.savingsAmount ?? discount.unitDiscount ?? discount.value;

    if (options?.isPartialProduct) {
      return t("store.products.discount.upToFixedOff", {
        amount: formatCurrency(savingsAmount, currency, locale),
      });
    }

    return t("store.products.discount.fixedOff", {
      amount: formatCurrency(savingsAmount, currency, locale),
    });
  }

  static formatOriginalProductPrice(
    product: PublicProductDto,
    currency: string,
    locale: string,
  ): string | null {
    if (!CatalogueDiscountUtils.shouldShowCardStrikeThrough(product)) {
      return null;
    }

    const variants = product.variants ?? [];
    const originals = variants
      .filter((variant) => variant.discount != null)
      .map((variant) => variant.originalSellingPrice)
      .filter((price): price is number => price != null && price > 0);

    if (originals.length === 0) {
      return null;
    }

    const minOriginal = Math.min(...originals);
    const maxOriginal = Math.max(...originals);

    if (minOriginal === maxOriginal) {
      return formatCurrency(minOriginal, currency, locale);
    }

    return `${formatCurrency(minOriginal, currency, locale)} - ${formatCurrency(
      maxOriginal,
      currency,
      locale,
    )}`;
  }

  static getPreviewCatalogueDiscountLabel(
    items: OrderPreviewItem[] | undefined,
  ): string | null {
    if (!items?.length) {
      return null;
    }

    const names = [
      ...new Set(
        items
          .map((item) => item.catalogueDiscount?.name)
          .filter((name): name is string => Boolean(name?.trim())),
      ),
    ];

    if (names.length === 1) {
      return names[0];
    }

    return null;
  }

  static getPreviewDiscountBreakdown(
    preview: OrderPreviewResponse | null,
    defaultCatalogueLabel: string,
  ): {
    catalogueDiscountTotal: number;
    additionalDiscountTotal: number;
    catalogueDiscountLabel: string;
  } {
    const catalogueDiscountTotal = preview?.catalogueDiscountTotal ?? 0;
    const additionalDiscountTotal = preview
      ? Math.max(0, preview.totalDiscount - catalogueDiscountTotal)
      : 0;
    const catalogueDiscountLabel =
      CatalogueDiscountUtils.getPreviewCatalogueDiscountLabel(preview?.items) ??
      defaultCatalogueLabel;

    return {
      catalogueDiscountTotal,
      additionalDiscountTotal,
      catalogueDiscountLabel,
    };
  }
}
