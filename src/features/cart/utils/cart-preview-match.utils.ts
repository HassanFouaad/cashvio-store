import { ApiCartItem } from "@/features/cart/api/cart.types";
import { OrderPreviewItem } from "@/features/checkout/types/checkout.types";

export class CartPreviewMatchUtils {
  static buildModifierKey(modifierIds: string[] | null | undefined): string {
    return [...(modifierIds ?? [])].sort().join(",");
  }

  private static getLineModifierIds(item: ApiCartItem): string[] {
    return (item.modifiers ?? []).map((modifier) => modifier.modifierId);
  }

  static matchPreviewItem(
    item: ApiCartItem,
    previewItems: OrderPreviewItem[] | undefined,
  ): OrderPreviewItem | undefined {
    if (!previewItems?.length) {
      return undefined;
    }

    const modifierKey = CartPreviewMatchUtils.buildModifierKey(
      CartPreviewMatchUtils.getLineModifierIds(item),
    );

    return previewItems.find((previewItem) => {
      if (previewItem.variantId !== item.variant.id) {
        return false;
      }

      const previewModifierKey = CartPreviewMatchUtils.buildModifierKey(
        previewItem.modifiers?.map((modifier) => modifier.modifierId),
      );

      return previewModifierKey === modifierKey;
    });
  }
}
