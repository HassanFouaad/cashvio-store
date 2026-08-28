"use client";

import { Button } from "@/components/ui/button";
import type { PlaceOrderButtonProps } from "@/features/checkout/types/PlaceOrderButtonProps";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function PlaceOrderButton({
  disabled,
  isSubmitting,
  isLoadingPreview,
  className,
}: PlaceOrderButtonProps): React.JSX.Element {
  const t = useTranslations("checkout");

  return (
    <Button
      type="submit"
      className={className ?? "w-full"}
      size="lg"
      disabled={disabled}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
          {t("placingOrder")}
        </>
      ) : isLoadingPreview ? (
        <>
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
          {t("calculating")}
        </>
      ) : (
        t("placeOrder")
      )}
    </Button>
  );
}
