'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/features/cart/store";
import { previewOrder } from "@/features/checkout/api/checkout-api";
import {
  FulfillmentMethod,
  OrderPreviewResponse,
  PublicFulfillmentMethodDto,
} from "@/features/checkout/types/checkout.types";
import { formatCurrency } from "@/lib/utils/formatters";
import { Package, Store, UtensilsCrossed, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface CheckoutFormProps {
  storeId: string;
  currency: string;
  locale: string;
  fulfillmentMethods: PublicFulfillmentMethodDto[];
}

const FULFILLMENT_ICONS = {
  [FulfillmentMethod.DELIVERY]: Package,
  [FulfillmentMethod.PICKUP]: Store,
  [FulfillmentMethod.DINE_IN]: UtensilsCrossed,
};

export function CheckoutForm({
  storeId,
  currency,
  locale,
  fulfillmentMethods,
}: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const router = useRouter();

  // Cart state
  const items = useCartStore((state) => state.items);
  const isHydrated = useCartStore((state) => state.isHydrated);

  // Form state
  const [selectedMethod, setSelectedMethod] = useState<FulfillmentMethod | null>(
    fulfillmentMethods[0]?.fulfillmentMethod || null
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Preview state
  const [preview, setPreview] = useState<OrderPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Redirect to cart if empty (after hydration)
  useEffect(() => {
    if (isHydrated && items.length === 0) {
      router.push("/cart");
    }
  }, [isHydrated, items.length, router]);

  // Fetch order preview when cart items or fulfillment method changes
  const fetchPreview = useCallback(async () => {
    if (!isHydrated || items.length === 0 || !selectedMethod) {
      return;
    }

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const previewResponse = await previewOrder({
        storeId,
        fulfillmentMethod: selectedMethod,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
      });

      setPreview(previewResponse);
    } catch (error) {
      console.error("Failed to preview order:", error);
      setPreviewError(t("previewError"));
    } finally {
      setIsLoadingPreview(false);
    }
  }, [isHydrated, items, selectedMethod, storeId, customerName, customerPhone, notes, t]);

  // Fetch preview when dependencies change (debounced for customer info)
  useEffect(() => {
    fetchPreview();
  }, [selectedMethod, items, isHydrated, storeId]);

  // Handle fulfillment method selection
  const handleMethodSelect = (method: FulfillmentMethod) => {
    setSelectedMethod(method);
  };

  // Show loading state while hydrating
  if (!isHydrated) {
    return <CheckoutFormSkeleton />;
  }

  // Empty cart (shouldn't reach here due to redirect, but just in case)
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Checkout Form - Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Fulfillment Method Selection */}
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">{t("fulfillmentMethod")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fulfillmentMethods.map((fm) => {
              const Icon = FULFILLMENT_ICONS[fm.fulfillmentMethod];
              const isSelected = selectedMethod === fm.fulfillmentMethod;

              return (
                <button
                  key={fm.fulfillmentMethod}
                  onClick={() => handleMethodSelect(fm.fulfillmentMethod)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">
                    {t(`methods.${fm.fulfillmentMethod.toLowerCase()}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">{t("customerInfo")}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                {t("name")}
              </label>
              <Input
                id="name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                {t("phone")}
              </label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1.5">
                {t("notes")}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary - Right Column */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24">
          <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold">{tCart("orderSummary")}</h2>

            {isLoadingPreview ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : previewError ? (
              <div className="text-sm text-destructive">{previewError}</div>
            ) : preview ? (
              <>
                {/* Items count */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {tCart("subtotal")} ({items.length}{" "}
                      {items.length === 1 ? tCart("item") : tCart("items")})
                    </span>
                    <span className="font-medium">
                      {formatCurrency(preview.subtotal, currency, locale)}
                    </span>
                  </div>

                  {/* Discount */}
                  {preview.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("discount")}</span>
                      <span className="font-medium text-green-600 dark:text-green-500">
                        -{formatCurrency(preview.totalDiscount, currency, locale)}
                      </span>
                    </div>
                  )}

                  {/* Service Fees */}
                  {preview.serviceFees > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("serviceFees")}</span>
                      <span className="font-medium">
                        {formatCurrency(preview.serviceFees, currency, locale)}
                      </span>
                    </div>
                  )}

                  {/* Delivery Fees */}
                  {preview.deliveryFees > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("deliveryFees")}</span>
                      <span className="font-medium">
                        {formatCurrency(preview.deliveryFees, currency, locale)}
                      </span>
                    </div>
                  )}

                  {/* Tax */}
                  {preview.totalTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{tCart("tax")}</span>
                      <span className="font-medium">
                        {formatCurrency(preview.totalTax, currency, locale)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold">{tCart("total")}</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(preview.totalAmount, currency, locale)}
                    </span>
                  </div>
                </div>
              </>
            ) : null}

            {/* Place Order Button (placeholder for now) */}
            <Button
              className="w-full"
              size="lg"
              disabled={!preview || isLoadingPreview}
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("calculating")}
                </>
              ) : (
                t("placeOrder")
              )}
            </Button>

            {/* Back to Cart */}
            <Link
              href="/cart"
              className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("backToCart")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutFormSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1">
        <div className="p-4 sm:p-6 bg-muted/50 rounded-xl space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
