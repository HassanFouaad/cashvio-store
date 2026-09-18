"use client";

import type { CartStoreError } from "@/features/cart/types/cart-error.types";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CartErrorBannerProps {
  error: CartStoreError;
  onDismiss?: () => void;
}

export function CartErrorBanner({ error, onDismiss }: CartErrorBannerProps) {
  const t = useTranslations("cart");

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-destructive">
          {t(error.key, error.values)}
        </p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 text-xs font-medium text-destructive underline"
          >
            {t("dismiss")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
