"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { FulfillmentMethod } from "@/features/checkout/types/checkout.types";
import { getOrderSuccessRecap } from "@/features/checkout/utils/order-success-recap";
import { StoreFrontSocialMediaDto } from "@/features/store/types/store.types";
import { formatCurrency } from "@/lib/utils/formatters";
import { buildStoreWhatsAppLink } from "@/lib/utils/whatsapp";
import {
  Check,
  Loader2,
  MessageCircle,
  PackageSearch,
  Phone,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { trackOrder } from "../api";
import {
  FulfillmentStatus,
  PublicOrderTrackingDto,
} from "../types/order-tracking.types";

interface TrackOrderFormProps {
  locale: string;
  defaultPhoneCountry?: string;
  socialMedia?: StoreFrontSocialMediaDto | null;
}

/** Fulfillment steps shown in the progress indicator, per method */
const DELIVERY_STEPS: FulfillmentStatus[] = [
  FulfillmentStatus.PENDING,
  FulfillmentStatus.PREPARING,
  FulfillmentStatus.READY,
  FulfillmentStatus.DELIVERING,
  FulfillmentStatus.COMPLETED,
];

const PICKUP_STEPS: FulfillmentStatus[] = [
  FulfillmentStatus.PENDING,
  FulfillmentStatus.PREPARING,
  FulfillmentStatus.READY,
  FulfillmentStatus.COMPLETED,
];

export function TrackOrderForm({
  locale,
  defaultPhoneCountry,
  socialMedia,
}: TrackOrderFormProps) {
  const t = useTranslations("orderTracking");
  const searchParams = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("orderNumber") ?? "",
  );
  const [phone, setPhone] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<PublicOrderTrackingDto | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const hasPrefilledPhone = useRef(false);

  // Arriving from order-success: the checkout recap already holds the
  // verified phone — prefill it instead of asking again seconds later.
  // Runs after mount (sessionStorage is client-only) to keep SSR markup stable.
  useEffect(() => {
    if (hasPrefilledPhone.current) return;
    hasPrefilledPhone.current = true;

    const orderNumberParam = searchParams.get("orderNumber");
    if (!orderNumberParam) return;

    const recap = getOrderSuccessRecap(orderNumberParam);
    if (recap?.phone) {
      setPhone(recap.phone);
      // The phone was validated at checkout before the order was placed
      setIsPhoneValid(true);
    }
  }, [searchParams]);

  const handlePhoneChange = useCallback((value: string, isValid: boolean) => {
    setPhone(value);
    setIsPhoneValid(isValid);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!orderNumber.trim() || !isPhoneValid) {
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const tracking = await trackOrder({
        orderNumber: orderNumber.trim(),
        phone,
      });
      setResult(tracking);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const isCancelled =
    result?.fulfillmentStatus === FulfillmentStatus.CANCELLED;
  const isDelivery = result?.fulfillmentMethod === FulfillmentMethod.DELIVERY;
  const isDineIn = result?.fulfillmentMethod === FulfillmentMethod.DINE_IN;
  const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentStepIndex = result
    ? Math.max(0, steps.indexOf(result.fulfillmentStatus))
    : 0;

  // "What happens next" copy for the current status (READY differs by method)
  const expectationKey = result
    ? result.fulfillmentStatus === FulfillmentStatus.READY
      ? isDelivery
        ? "readyDelivery"
        : isDineIn
          ? "readyDineIn"
          : "readyPickup"
      : result.fulfillmentStatus.toLowerCase()
    : null;

  // Table number from the checkout recap (same session) when tracking a dine-in order
  const dineInTableNumber =
    result?.fulfillmentMethod === FulfillmentMethod.DINE_IN
      ? getOrderSuccessRecap(result.orderNumber)?.tableNumber
      : undefined;

  // Contact the merchant about this order — WhatsApp honors the store's
  // visibility toggle; calling uses the public contact phone
  const contactOrderNumber = result?.orderNumber ?? orderNumber.trim();
  const storeWhatsAppLink = buildStoreWhatsAppLink(socialMedia);
  const whatsAppHref = storeWhatsAppLink
    ? contactOrderNumber
      ? `${storeWhatsAppLink}?text=${encodeURIComponent(
          t("contactMerchant.whatsappMessage", {
            orderNumber: contactOrderNumber,
          }),
        )}`
      : storeWhatsAppLink
    : null;
  const contactPhoneHref = socialMedia?.contactPhone
    ? `tel:${socialMedia.contactPhone.replace(/\s+/g, "")}`
    : null;
  const showContactMerchant = Boolean(
    (result !== null || notFound) && (whatsAppHref || contactPhoneHref),
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Lookup form */}
      <form
        onSubmit={handleSubmit}
        className="sf-panel p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4"
        aria-label={t("formAriaLabel")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="track-order-number"
              className="block text-sm font-medium mb-1.5"
            >
              {t("orderNumber")}
            </label>
            <Input
              id="track-order-number"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder={t("orderNumberPlaceholder")}
              autoComplete="off"
            />
            {hasSubmitted && !orderNumber.trim() && (
              <p className="mt-1.5 text-sm text-destructive">
                {t("orderNumberRequired")}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="track-phone"
              className="block text-sm font-medium mb-1.5"
            >
              {t("phone")}
            </label>
            <PhoneInput
              id="track-phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder={t("phonePlaceholder")}
              defaultCountry={defaultPhoneCountry ?? "eg"}
              aria-label={t("phone")}
            />
            {hasSubmitted && !isPhoneValid && (
              <p className="mt-1.5 text-sm text-destructive">
                {t("phoneInvalid")}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("searching")}
            </>
          ) : (
            t("trackButton")
          )}
        </Button>
      </form>

      {/* Not found */}
      {notFound && (
        <div className="sf-panel flex items-start gap-3 p-4 rounded-xl border border-border">
          <PackageSearch className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("notFoundTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("notFoundDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="sf-panel rounded-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-muted/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {t("orderNumber")}
              </p>
              <p className="text-lg font-bold font-mono">
                {result.orderNumber}
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {t("orderDate")}
              </p>
              <p className="text-sm font-medium">
                {new Date(result.orderDate).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="p-4 sm:p-6 border-t border-border">
            {isCancelled ? (
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">{t("status.cancelled")}</span>
              </div>
            ) : (
              <ol className="flex items-center" aria-label={t("progressAriaLabel")}>
                {steps.map((step, index) => {
                  const isDone = index <= currentStepIndex;
                  const isLast = index === steps.length - 1;
                  return (
                    <li
                      key={step}
                      className={`flex items-center ${isLast ? "" : "flex-1"}`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                            isDone
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span
                          className={`text-[10px] sm:text-xs whitespace-nowrap ${
                            isDone
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {t(`status.${step.toLowerCase()}`)}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={`mx-1 sm:mx-2 mb-5 h-0.5 flex-1 rounded ${
                            index < currentStepIndex ? "bg-primary" : "bg-border"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}

            {/* What to expect at the current status */}
            {expectationKey && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t(`statusExpectation.${expectationKey}`)}
              </p>
            )}

            {dineInTableNumber && (
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">{t("tableNumber")}: </span>
                <span className="font-semibold">{dineInTableNumber}</span>
              </p>
            )}
          </div>

          {/* Items */}
          <div className="p-4 sm:p-6 border-t border-border space-y-3">
            {result.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.productName}</p>
                  {item.variantName && item.variantName !== item.productName && (
                    <p className="text-muted-foreground text-xs truncate">
                      {item.variantName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-muted-foreground">
                    ×{item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.lineTotal, result.currency, locale)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-4 sm:p-6 border-t border-border space-y-2 text-sm">
            {result.totalDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("discount")}</span>
                <span className="font-medium text-green-600 dark:text-green-500">
                  -{formatCurrency(result.totalDiscount, result.currency, locale)}
                </span>
              </div>
            )}
            {result.totalTax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("tax")}</span>
                <span className="font-medium">
                  {formatCurrency(result.totalTax, result.currency, locale)}
                </span>
              </div>
            )}
            {result.serviceFees > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("serviceFees")}
                </span>
                <span className="font-medium">
                  {formatCurrency(result.serviceFees, result.currency, locale)}
                </span>
              </div>
            )}
            {result.deliveryFees > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("deliveryFees")}
                </span>
                <span className="font-medium">
                  {formatCurrency(result.deliveryFees, result.currency, locale)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-semibold">{t("total")}</span>
              <span className="font-bold">
                {formatCurrency(result.totalAmount, result.currency, locale)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contact the merchant — after a result or a failed lookup */}
      {showContactMerchant && (
        <div className="sf-panel p-4 sm:p-6 rounded-xl border border-border bg-muted/30 space-y-3">
          <div>
            <p className="text-sm font-semibold">{t("contactMerchant.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("contactMerchant.description")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {whatsAppHref && (
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {t("contactMerchant.whatsapp")}
                </Button>
              </a>
            )}
            {contactPhoneHref && (
              <a href={contactPhoneHref} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  {t("contactMerchant.call")}
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
