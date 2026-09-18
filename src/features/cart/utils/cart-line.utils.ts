import type { ApiCart, ApiCartItem } from "@/features/cart/api/cart.types";

/** Stable identity for a modifier selection: sorted unique ids joined */
export function getModifierSignature(modifierIds?: string[] | null): string {
  if (!modifierIds || modifierIds.length === 0) return "";
  return [...new Set(modifierIds)].sort().join("|");
}

/** Selection key used before a server line id exists (adds) */
export function getSelectionKey(
  variantId: string,
  modifierIds?: string[],
): string {
  return `${variantId}::${getModifierSignature(modifierIds)}`;
}

/** Modifier ids stored on a cart line */
export function getLineModifierIds(item: ApiCartItem): string[] {
  return (item.modifiers ?? []).map((modifier) => modifier.modifierId);
}

/** Find the line matching a variant + exact modifier selection */
export function findLineBySelection(
  cart: ApiCart | null,
  variantId: string,
  modifierIds?: string[],
): ApiCartItem | undefined {
  if (!cart) return undefined;
  const signature = getModifierSignature(modifierIds);
  return cart.items.find(
    (item) =>
      item.variant.id === variantId &&
      getModifierSignature(getLineModifierIds(item)) === signature,
  );
}

/** Distinct persisted lines in the cart (not total quantity). */
export function getDistinctLineCount(cart: ApiCart | null): number {
  return cart?.items.length ?? 0;
}
