import {
  CartPreviewError,
  type CartPreviewState,
  type ResolveCartPreviewInput,
} from "@/features/cart/types/cart-preview.types";

/** A quote belongs to one exact input snapshot, not merely the last response. */
export function resolveCartPreviewState({
  request,
  result,
  hasItems,
  isInitialized,
  methodsError,
}: ResolveCartPreviewInput): CartPreviewState {
  if (!hasItems || !isInitialized)
    return { preview: null, isPreviewLoading: false, previewError: null };
  if (methodsError)
    return {
      preview: null,
      isPreviewLoading: false,
      previewError: methodsError,
    };
  if (!request || result?.request !== request)
    return { preview: null, isPreviewLoading: true, previewError: null };
  if (result.error || !result.preview)
    return {
      preview: null,
      isPreviewLoading: false,
      previewError: result.error ?? CartPreviewError.LOAD_FAILED,
    };
  return {
    preview: result.preview,
    isPreviewLoading: false,
    previewError: null,
  };
}
