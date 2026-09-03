"use client";

import {
  useCartOrderPreview,
  type UseCartOrderPreviewResult,
} from "@/features/cart/hooks/use-cart-order-preview";
import { createContext, useContext, type ReactNode } from "react";

const CartPreviewContext = createContext<UseCartOrderPreviewResult | null>(
  null,
);

interface CartPreviewProviderProps {
  storeId: string;
  children: ReactNode;
}

export function CartPreviewProvider({
  storeId,
  children,
}: CartPreviewProviderProps) {
  const previewState = useCartOrderPreview(storeId);

  return (
    <CartPreviewContext.Provider value={previewState}>
      {children}
    </CartPreviewContext.Provider>
  );
}

export function useSharedCartPreview(): UseCartOrderPreviewResult {
  const previewState = useContext(CartPreviewContext);
  if (!previewState) {
    throw new Error("useSharedCartPreview must be used within CartPreviewProvider");
  }
  return previewState;
}
