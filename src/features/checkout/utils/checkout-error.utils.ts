import { MAX_PUBLIC_ORDER_ITEMS } from "@/features/cart/constants";
import { isCartLineLimitApiError } from "@/features/cart/utils/cart-api-error.utils";
import { ApiException } from "@/lib/api/types";

export function resolveCheckoutPreviewErrorMessage(
  error: unknown,
  itemCount: number,
  tCheckout: (key: "previewError") => string,
  tCart: (
    key: "lineLimitExceeded" | "orderItemLimitExceeded",
    values: { max: number },
  ) => string,
): string {
  if (itemCount > MAX_PUBLIC_ORDER_ITEMS) {
    return tCart("orderItemLimitExceeded", { max: MAX_PUBLIC_ORDER_ITEMS });
  }
  if (isCartLineLimitApiError(error)) {
    return tCart("lineLimitExceeded", { max: MAX_PUBLIC_ORDER_ITEMS });
  }
  if (error instanceof ApiException && error.message) {
    return error.message;
  }
  return tCheckout("previewError");
}

export function resolveCheckoutSubmitErrorMessage(
  error: unknown,
  itemCount: number,
  tCheckout: (key: "orderError") => string,
  tCart: (
    key: "lineLimitExceeded" | "orderItemLimitExceeded",
    values: { max: number },
  ) => string,
): string {
  if (itemCount > MAX_PUBLIC_ORDER_ITEMS) {
    return tCart("orderItemLimitExceeded", { max: MAX_PUBLIC_ORDER_ITEMS });
  }
  if (isCartLineLimitApiError(error)) {
    return tCart("lineLimitExceeded", { max: MAX_PUBLIC_ORDER_ITEMS });
  }
  if (error instanceof ApiException && error.message) {
    return error.message;
  }
  return tCheckout("orderError");
}
