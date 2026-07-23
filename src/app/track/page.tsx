import { TrackOrderForm } from "@/features/order-tracking/components";
import { resolveRequestStore } from "@/lib/api/resolve-request-store";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.track");

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

export default async function TrackOrderPage() {
  const { store, subdomain } = await resolveRequestStore();

  if (!subdomain || !store) {
    throw new Error("Invalid store subdomain");
  }

  const t = await getTranslations("orderTracking");
  const locale = await getLocale();

  return (
    <div className="sf-order-shell w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <section className="sf-order-header w-full max-w-full bg-muted/30 py-6 sm:py-8 md:py-12">
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

      {/* Tracking form + result */}
      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container">
          <Suspense fallback={null}>
            <TrackOrderForm
              locale={locale}
              defaultPhoneCountry={store.country?.code?.toLowerCase()}
              socialMedia={store.storeFront?.socialMedia}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
