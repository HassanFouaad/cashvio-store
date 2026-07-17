import {
  getCountries,
  getDeliveryZones,
  getFulfillmentMethods,
  getStorefrontPaymentMethods,
} from "@/features/checkout/api/checkout-api";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import {
  CommonCountryDto,
  FulfillmentMethod,
  PublicDeliveryZonesResponseDto,
  PublicStorefrontPaymentMethodDto,
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

  // Fetch checkout config in parallel. Delivery zones are fetched
  // speculatively (only wasted when the store doesn't offer delivery,
  // which is the rare case) — this keeps checkout at one round-trip.
  const [fulfillmentMethodsResult, paymentMethodsResult, deliveryZonesResult] =
    await Promise.allSettled([
      getFulfillmentMethods(store.id),
      getStorefrontPaymentMethods(store.id),
      getDeliveryZones(store.id),
    ]);

  // Fulfillment methods are required — without them checkout cannot work
  if (
    fulfillmentMethodsResult.status === "rejected" ||
    fulfillmentMethodsResult.value.length === 0
  ) {
    redirect("/cart");
  }
  const fulfillmentMethods = fulfillmentMethodsResult.value;

  // Payment methods fetch failed — proceed with empty (default to CASH on backend)
  const storefrontPaymentMethods: PublicStorefrontPaymentMethodDto[] =
    paymentMethodsResult.status === "fulfilled" ? paymentMethodsResult.value : [];

  let deliveryZones: PublicDeliveryZonesResponseDto | null = null;
  let fallbackCountries: CommonCountryDto[] | null = null;
  const hasDeliveryMethod = fulfillmentMethods.some(
    (m) => m.fulfillmentMethod === FulfillmentMethod.DELIVERY,
  );

  if (hasDeliveryMethod) {
    deliveryZones =
      deliveryZonesResult.status === "fulfilled"
        ? deliveryZonesResult.value
        : null;

    // If store has no configured delivery zones, fallback to common countries/cities
    const hasNoZones =
      !deliveryZones || !deliveryZones.zones || deliveryZones.zones.length === 0;
    if (hasNoZones) {
      try {
        fallbackCountries = await getCountries();
      } catch {
        // Countries fetch failed, proceed without fallback
        fallbackCountries = null;
      }
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
            fallbackCountries={fallbackCountries}
            storefrontPaymentMethods={storefrontPaymentMethods}
            defaultPhoneCountry={store.country?.code?.toLowerCase()}
          />
        </div>
      </section>
    </div>
  );
}
