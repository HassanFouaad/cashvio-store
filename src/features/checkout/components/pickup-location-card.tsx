"use client";

import {
  formatPickupAddressLines,
  hasPickupAddressLines,
  type StorePickupLocation,
} from "@/features/checkout/utils/pickup-location";
import { MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

interface PickupLocationCardProps {
  location: StorePickupLocation;
  /** Compact card for order-success; default is the checkout section style */
  variant?: "checkout" | "success";
}

/**
 * Shows where the customer should pick up their order.
 * Matches the delivery-address section visual language on checkout.
 */
export function PickupLocationCard({
  location,
  variant = "checkout",
}: PickupLocationCardProps) {
  const t = useTranslations(
    variant === "success" ? "orderSuccess" : "checkout",
  );
  const addressLines = formatPickupAddressLines(location);
  const hasAddress = hasPickupAddressLines(location);
  const phone = location.contactPhone?.trim() || null;

  const shellClass =
    variant === "success"
      ? "p-4 bg-muted/50 rounded-xl border border-border space-y-3"
      : "p-4 sm:p-6 bg-muted/50 rounded-xl space-y-3";

  return (
    <div className={shellClass} aria-label={t("pickupLocation")}>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary shrink-0" aria-hidden />
        <h2
          className={
            variant === "success"
              ? "text-sm font-semibold"
              : "text-lg font-semibold"
          }
        >
          {t("pickupLocation")}
        </h2>
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-medium">{location.storeName}</p>
        {hasAddress ? (
          addressLines.map((line) => (
            <p key={line} className="text-muted-foreground leading-relaxed">
              {line}
            </p>
          ))
        ) : (
          <p className="text-muted-foreground leading-relaxed">
            {t("pickupLocationFallback")}
          </p>
        )}
      </div>

      {phone && (
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-2"
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          <span>{phone}</span>
        </a>
      )}
    </div>
  );
}
