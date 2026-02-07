import {
  getDeliveryZones,
  getFulfillmentMethods,
} from "@/features/checkout/api/checkout-api";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import {
  FulfillmentMethod,
  PublicDeliveryZonesResponseDto,
} from "@/features/checkout/types/checkout.types";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { TrackBeginCheckoutEvent } from "@/lib/analytics/track-cart-events";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.checkout");

  // Resolve store and set API context
  const { store } = await resolveRequestStore();

  if (!store) {
    return {
      title: t("title"),
      description: t("description"),
    };
  }

  return {
    title: t("titleWithStore", { storeName: store.name }),
    description: t("descriptionWithStore", { storeName: store.name }),
  };
}

export default async function CheckoutPage() {
  // Resolve store and set API context
  const { store, subdomain } = await resolveRequestStore();

  if (!subdomain || !store) {
    throw new Error("Invalid store subdomain");
  }

  const t = await getTranslations("checkout");
  const locale = await getLocale();

  // Fetch available fulfillment methods
  let fulfillmentMethods;
  try {
    fulfillmentMethods = await getFulfillmentMethods(store.id);
  } catch {
    // If we can't get fulfillment methods, redirect to cart with error
    redirect("/cart");
  }

  // If no fulfillment methods available, redirect to cart
  if (!fulfillmentMethods || fulfillmentMethods.length === 0) {
    redirect("/cart");
  }

  // Fetch delivery zones if delivery method is available
  let deliveryZones: PublicDeliveryZonesResponseDto | null = null;
  const hasDeliveryMethod = fulfillmentMethods.some(
    (m) => m.fulfillmentMethod === FulfillmentMethod.DELIVERY,
  );

  if (hasDeliveryMethod) {
    try {
      deliveryZones = await getDeliveryZones(store.id);
    } catch {
      // Delivery zones fetch failed, but we can still proceed
      deliveryZones = null;
    }
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <section className="w-full max-w-full bg-muted/30 py-6 sm:py-8 md:py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t("pageTitle")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("pageDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* Analytics: Track begin_checkout */}
      <TrackBeginCheckoutEvent currency={store.currency} />

      {/* Checkout Content */}
      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container">
          <CheckoutForm
            storeId={store.id}
            currency={store.currency}
            locale={locale}
            fulfillmentMethods={fulfillmentMethods}
            deliveryZones={deliveryZones}
          />
        </div>
      </section>
    </div>
  );
}
