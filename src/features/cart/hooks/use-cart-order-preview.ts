"use client";

import {
  getFulfillmentMethods,
  previewOrder,
} from "@/features/checkout/api/checkout-api";
import {
  FulfillmentMethod,
  OrderPreviewResponse,
  PublicFulfillmentMethodDto,
} from "@/features/checkout/types/checkout.types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore, usePendingChangesCount } from "../store";

const PREVIEW_DEBOUNCE_MS = 400;

const FULFILLMENT_PRIORITY: FulfillmentMethod[] = [
  FulfillmentMethod.DELIVERY,
  FulfillmentMethod.PICKUP,
  FulfillmentMethod.DINE_IN,
];

function pickDefaultMethod(
  methods: PublicFulfillmentMethodDto[],
): FulfillmentMethod | null {
  if (methods.length === 0) return null;
  const sorted = [...methods].sort((a, b) => {
    const priorityA = FULFILLMENT_PRIORITY.indexOf(a.fulfillmentMethod);
    const priorityB = FULFILLMENT_PRIORITY.indexOf(b.fulfillmentMethod);
    return (
      (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB)
    );
  });
  return sorted[0]?.fulfillmentMethod ?? null;
}

export interface UseCartOrderPreviewResult {
  preview: OrderPreviewResponse | null;
  isPreviewLoading: boolean;
  previewError: string | null;
  fulfillmentMethod: FulfillmentMethod | null;
  availableMethods: PublicFulfillmentMethodDto[];
  setFulfillmentMethod: (method: FulfillmentMethod) => void;
  refetchPreview: () => void;
}

/**
 * Debounced public order preview for the cart summary — same source of truth
 * as checkout / POS ticket totals.
 */
export function useCartOrderPreview(
  storeId: string,
): UseCartOrderPreviewResult {
  const cart = useCartStore((state) => state.cart);
  const isInitialized = useCartStore((state) => state.isInitialized);
  const pendingChangesCount = usePendingChangesCount();

  const [availableMethods, setAvailableMethods] = useState<
    PublicFulfillmentMethodDto[]
  >([]);
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod | null>(null);
  const [preview, setPreview] = useState<OrderPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const previewSeqRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewItems = useMemo(() => {
    if (!cart?.items?.length) return [];
    return cart.items.map((item) => ({
      variantId: item.variant.id,
      quantity: item.quantity,
      modifierIds: item.modifiers?.map((modifier) => modifier.modifierId),
    }));
  }, [cart?.items]);

  const itemsSignature = useMemo(
    () =>
      previewItems
        .map(
          (item) =>
            `${item.variantId}:${item.quantity}:${(item.modifierIds ?? []).join(",")}`,
        )
        .join("|"),
    [previewItems],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMethods() {
      try {
        const methods = await getFulfillmentMethods(storeId);
        if (cancelled) return;
        setAvailableMethods(methods);
        setFulfillmentMethod((current) => {
          if (
            current &&
            methods.some((method) => method.fulfillmentMethod === current)
          ) {
            return current;
          }
          return pickDefaultMethod(methods);
        });
      } catch {
        if (!cancelled) {
          setAvailableMethods([]);
          setFulfillmentMethod(null);
        }
      }
    }

    void loadMethods();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const runPreview = useCallback(async () => {
    if (
      !isInitialized ||
      !fulfillmentMethod ||
      previewItems.length === 0 ||
      pendingChangesCount > 0
    ) {
      if (previewItems.length === 0) {
        setPreview(null);
        setPreviewError(null);
        setIsPreviewLoading(false);
      } else if (pendingChangesCount > 0) {
        setPreview(null);
        setIsPreviewLoading(true);
      }
      return;
    }

    const seq = ++previewSeqRef.current;
    setIsPreviewLoading(true);
    setPreviewError(null);

    try {
      const nextPreview = await previewOrder({
        storeId,
        fulfillmentMethod,
        items: previewItems,
      });
      if (seq !== previewSeqRef.current) return;
      setPreview(nextPreview);
    } catch {
      if (seq !== previewSeqRef.current) return;
      setPreview(null);
      setPreviewError("previewError");
    } finally {
      if (seq === previewSeqRef.current) {
        setIsPreviewLoading(false);
      }
    }
  }, [
    fulfillmentMethod,
    isInitialized,
    pendingChangesCount,
    previewItems,
    storeId,
  ]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void runPreview();
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [runPreview, itemsSignature, fulfillmentMethod, pendingChangesCount]);

  return {
    preview,
    isPreviewLoading,
    previewError,
    fulfillmentMethod,
    availableMethods,
    setFulfillmentMethod,
    refetchPreview: runPreview,
  };
}
