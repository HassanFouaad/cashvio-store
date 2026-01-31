import { getFulfillmentMethods } from "@/features/checkout/api/checkout-api";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { getStoreByCode } from "@/features/store/api/get-store";
import { getStoreCode } from "@/features/store/utils/store-resolver";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const code = getStoreCode(hostname);

  if (!code) {
    return {
      title: "Checkout",
      description: "Complete your purchase",
    };
  }

  const store = await getStoreByCode(code);

  return {
    title: `Checkout - ${store.name}`,
    description: `Complete your purchase at ${store.name}`,
  };
}

export default async function CheckoutPage() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const code = getStoreCode(hostname);

  if (!code) {
    throw new Error("Invalid store subdomain");
  }

  const store = await getStoreByCode(code);
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

      {/* Checkout Content */}
      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container">
          <CheckoutForm
            storeId={store.id}
            currency={store.currency}
            locale={locale}
            fulfillmentMethods={fulfillmentMethods}
          />
        </div>
      </section>
    </div>
  );
}
