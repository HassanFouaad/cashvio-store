import type { ApiCart } from "@/features/cart/api/cart.types";
import {
  CART_MAX_DISTINCT_LINES,
  MAX_PUBLIC_ORDER_ITEMS,
} from "@/features/cart/constants";
import {
  findLineBySelection,
  getDistinctLineCount,
} from "@/features/cart/utils/cart-line.utils";

/** Whether this add would create a new distinct line (not merge quantity). */
export function wouldAddNewLine(
  cart: ApiCart | null,
  variantId: string,
  modifierIds?: string[],
): boolean {
  return findLineBySelection(cart, variantId, modifierIds) === undefined;
}

/** Cart already holds the maximum number of distinct lines. */
export function isAtDistinctLineLimit(cart: ApiCart | null): boolean {
  return getDistinctLineCount(cart) >= CART_MAX_DISTINCT_LINES;
}

/** Block a new distinct line; existing-line quantity updates remain allowed. */
export function isBlockedNewLineAdd(
  cart: ApiCart | null,
  variantId: string,
  modifierIds?: string[],
): boolean {
  return wouldAddNewLine(cart, variantId, modifierIds) && isAtDistinctLineLimit(cart);
}

/** Legacy or oversized carts that cannot proceed to checkout. */
export function exceedsOrderItemLimit(cart: ApiCart | null): boolean {
  return getDistinctLineCount(cart) > MAX_PUBLIC_ORDER_ITEMS;
}
