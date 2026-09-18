import { CART_MAX_DISTINCT_LINES } from "@/features/cart/constants";
import { ApiException } from "@/lib/api/types";

export type CartErrorKey =
  | "lineLimitExceeded"
  | "addItemFailed"
  | "updateQuantityFailed"
  | "removeItemFailed"
  | "clearCartFailed"
  | "loadFailed";

export interface CartStoreError {
  key: CartErrorKey;
  values?: Record<string, string | number>;
}

export function isCartLineLimitApiError(error: unknown): boolean {
  return error instanceof ApiException && error.statusCode === 409;
}

export function resolveCartMutationError(
  error: unknown,
  operation: "add" | "update" | "remove" | "clear",
): CartStoreError {
  if (isCartLineLimitApiError(error)) {
    return {
      key: "lineLimitExceeded",
      values: { max: CART_MAX_DISTINCT_LINES },
    };
  }

  const keyByOperation: Record<typeof operation, CartErrorKey> = {
    add: "addItemFailed",
    update: "updateQuantityFailed",
    remove: "removeItemFailed",
    clear: "clearCartFailed",
  };

  return { key: keyByOperation[operation] };
}
