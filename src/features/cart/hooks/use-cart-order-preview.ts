"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useCartStore,
  useIsCartSyncing,
  usePendingChangesCount,
} from "@/features/cart/store";
import {
  CartPreviewError,
  type CartMethodSelection,
  type CartMethodsResult,
  type CartPreviewRequestSnapshot,
  type CartPreviewResult,
  type UseCartOrderPreviewResult,
} from "@/features/cart/types/cart-preview.types";
import { MAX_PUBLIC_ORDER_ITEMS } from "@/features/cart/constants";
import { resolveCartPreviewState } from "@/features/cart/utils/cart-preview-state";
import {
  getFulfillmentMethods,
  previewOrder,
} from "@/features/checkout/api/checkout-api";
import {
  FulfillmentMethod,
  type PublicFulfillmentMethodDto,
} from "@/features/checkout/types/checkout.types";

export type { UseCartOrderPreviewResult } from "@/features/cart/types/cart-preview.types";

const PREVIEW_DEBOUNCE_MS = 400;
const FULFILLMENT_PRIORITY = [
  FulfillmentMethod.DELIVERY,
  FulfillmentMethod.PICKUP,
  FulfillmentMethod.DINE_IN,
];

function pickDefaultMethod(
  methods: PublicFulfillmentMethodDto[],
): FulfillmentMethod | null {
  return (
    FULFILLMENT_PRIORITY.find((value) =>
      methods.some((method) => method.fulfillmentMethod === value),
    ) ??
    methods[0]?.fulfillmentMethod ??
    null
  );
}

/** Quotes become stale immediately when inputs change, including during debounce. */
export function useCartOrderPreview(
  storeId: string,
): UseCartOrderPreviewResult {
  const cartItems = useCartStore((state) => state.cart?.items);
  const isInitialized = useCartStore((state) => state.isInitialized);
  const isCartSyncing = useIsCartSyncing();
  const pendingChangesCount = usePendingChangesCount();
  const [methodsRevision, setMethodsRevision] = useState(0);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [methodsResult, setMethodsResult] = useState<CartMethodsResult | null>(
    null,
  );
  const [selection, setSelection] = useState<CartMethodSelection | null>(null);
  const [result, setResult] = useState<CartPreviewResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMethods(): Promise<void> {
      try {
        const methods = await getFulfillmentMethods(storeId);
        if (!cancelled)
          setMethodsResult({
            storeId,
            revision: methodsRevision,
            methods,
            error: methods.length ? null : CartPreviewError.NO_METHODS,
          });
      } catch {
        if (!cancelled)
          setMethodsResult({
            storeId,
            revision: methodsRevision,
            methods: [],
            error: CartPreviewError.LOAD_FAILED,
          });
      }
    }
    void loadMethods();
    return () => {
      cancelled = true;
    };
  }, [storeId, methodsRevision]);

  const areMethodsCurrent =
    methodsResult?.storeId === storeId &&
    methodsResult.revision === methodsRevision;
  const availableMethods = areMethodsCurrent ? methodsResult.methods : [];
  const methodsError = areMethodsCurrent ? methodsResult.error : null;
  const fulfillmentMethod =
    selection?.storeId === storeId &&
    availableMethods.some(
      (method) => method.fulfillmentMethod === selection.method,
    )
      ? selection.method
      : pickDefaultMethod(availableMethods);
  const hasItems = Boolean(cartItems?.length);

  // A new cart snapshot also covers server-side price/stock corrections,
  // even if its variant IDs and quantities happen to be unchanged.
  const request = useMemo<CartPreviewRequestSnapshot | null>(() => {
    if (
      !isInitialized ||
      !fulfillmentMethod ||
      !cartItems?.length ||
      isCartSyncing ||
      pendingChangesCount > 0
    )
      return null;
    return {
      revision: previewRevision,
      body: {
        storeId,
        fulfillmentMethod,
        items: cartItems.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
          modifierIds: item.modifiers?.map((modifier) => modifier.modifierId),
        })),
      },
    };
  }, [
    cartItems,
    fulfillmentMethod,
    isInitialized,
    isCartSyncing,
    pendingChangesCount,
    previewRevision,
    storeId,
  ]);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if ((cartItems?.length ?? 0) > MAX_PUBLIC_ORDER_ITEMS) {
        if (!cancelled)
          setResult({
            request,
            preview: null,
            error: CartPreviewError.TOO_MANY_ITEMS,
          });
        return;
      }

      try {
        const preview = await previewOrder(request.body);
        if (!cancelled) setResult({ request, preview, error: null });
      } catch {
        if (!cancelled)
          setResult({
            request,
            preview: null,
            error: CartPreviewError.LOAD_FAILED,
          });
      }
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [request, cartItems]);

  const setFulfillmentMethod = useCallback(
    (method: FulfillmentMethod): void => setSelection({ storeId, method }),
    [storeId],
  );
  const refetchPreview = useCallback((): void => {
    if (methodsError || !fulfillmentMethod)
      setMethodsRevision((revision) => revision + 1);
    else setPreviewRevision((revision) => revision + 1);
  }, [methodsError, fulfillmentMethod]);

  return {
    ...resolveCartPreviewState({
      request,
      result,
      hasItems,
      isInitialized,
      methodsError,
    }),
    fulfillmentMethod,
    availableMethods,
    setFulfillmentMethod,
    refetchPreview,
  };
}
