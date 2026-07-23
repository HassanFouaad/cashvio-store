"use client";

import { Button } from "@/components/ui/button";
import { PickupLocationCard } from "@/features/checkout/components/pickup-location-card";
import { FulfillmentMethod } from "@/features/checkout/types/checkout.types";
import {
  getOrderSuccessRecap,
  type OrderSuccessRecap,
} from "@/features/checkout/utils/order-success-recap";
import { buildPoweredByUrl } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { Check, CheckCircle, Copy, Home, PackageSearch, UtensilsCrossed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const TOKEN_KEY = "order-success-token";
/** Max token age (30 minutes) — the page stays refresh-safe for this window. */
const TOKEN_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Inner content component that uses useSearchParams.
 * Must be wrapped in Suspense to avoid hydration issues.
 */
function OrderSuccessContent() {
  const t = useTranslations("orderSuccess");
  const tFooter = useTranslations("footer");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get("orderNumber") ?? "";
  const [authorized, setAuthorized] = useState(false);
  const [recap, setRecap] = useState<OrderSuccessRecap | null>(null);
  const [copied, setCopied] = useState(false);
  const guardChecked = useRef(false);

  // ---------- Access guard ----------
  // The token is NOT consumed on read: refreshing the confirmation page
  // must keep working — this is the customer's only record of the order.
  useEffect(() => {
    if (guardChecked.current) return;
    guardChecked.current = true;

    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const tokenTime = token ? parseInt(token, 10) : NaN;

      if (
        Number.isNaN(tokenTime) ||
        Date.now() - tokenTime > TOKEN_MAX_AGE_MS
      ) {
        sessionStorage.removeItem(TOKEN_KEY);
        router.replace("/");
        return;
      }

      setRecap(getOrderSuccessRecap(orderNumber));
      setAuthorized(true);
    } catch {
      // sessionStorage unavailable — allow access if orderNumber exists
      if (orderNumber) {
        setAuthorized(true);
      } else {
        router.replace("/");
      }
    }
  }, [router, orderNumber]);

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the number is still visible to copy manually
    }
  };

  // Don't render anything until the guard check has completed
  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md space-y-6">
        {/* Confirmation heading */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            {t("message")}
          </p>
        </div>

        {/* Order number card */}
        {orderNumber && (
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  {t("orderNumber")}
                </p>
                <p className="text-lg sm:text-xl font-bold font-mono break-all">
                  {orderNumber}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyOrderNumber}
                className="gap-1.5 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {t("copy")}
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("saveNumberHint")}
            </p>
          </div>
        )}

        {/* Pickup location reminder for pickup orders */}
        {recap?.fulfillmentMethod === FulfillmentMethod.PICKUP &&
          recap.pickupLocation && (
            <PickupLocationCard
              location={recap.pickupLocation}
              variant="success"
            />
          )}

        {/* Table number reminder for dine-in orders */}
        {recap?.fulfillmentMethod === FulfillmentMethod.DINE_IN &&
          recap.tableNumber && (
            <div
              className="p-4 bg-muted/50 rounded-xl border border-border space-y-1"
              aria-label={t("tableNumber")}
            >
              <div className="flex items-center gap-2">
                <UtensilsCrossed
                  className="h-5 w-5 text-primary shrink-0"
                  aria-hidden
                />
                <p className="text-sm font-semibold">{t("tableNumber")}</p>
              </div>
              <p className="text-lg font-bold ps-7">{recap.tableNumber}</p>
            </div>
          )}

        {/* Order recap (stored locally at checkout — survives refresh) */}
        {recap && recap.items.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <p className="text-sm font-semibold">{t("recapTitle")}</p>
            </div>
            <div className="p-4 space-y-2.5">
              {recap.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate">
                    {item.name}
                    {item.variant && item.variant !== item.name && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {item.variant}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    ×{item.quantity}
                  </span>
                </div>
              ))}
              {recap.moreItemsCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("moreItems", { count: recap.moreItemsCount })}
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <span className="text-sm font-semibold">{t("total")}</span>
              <span className="font-bold">
                {formatCurrency(recap.totalAmount, recap.currency, locale)}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/track?orderNumber=${encodeURIComponent(orderNumber)}`}
            className="flex-1"
          >
            <Button className="w-full gap-2">
              <PackageSearch className="h-4 w-4" />
              {t("trackOrder")}
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" />
              {t("backToHome")}
            </Button>
          </Link>
        </div>

        {/* Powered by Cashvio — platform attribution + acquisition CTA */}
        <p className="text-center text-xs text-muted-foreground/70 pt-2">
          {tFooter("poweredBy")}{" "}
          <a
            href={buildPoweredByUrl("order_success")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:text-foreground transition-colors"
          >
            Cashvio
          </a>
          {" · "}
          <a
            href={buildPoweredByUrl("order_success")}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {tFooter("poweredByCta")}
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Order success page wrapped in Suspense boundary.
 * This is required because useSearchParams() needs a Suspense boundary
 * to avoid de-opting the entire page to client-side rendering.
 */
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}
