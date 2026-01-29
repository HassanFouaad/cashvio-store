import { CartList } from "@/features/cart/components/cart-list";
import { CartSummary } from "@/features/cart/components/cart-summary";
import { getStoreByCode } from "@/features/store/api/get-store";
import { getStoreCode } from "@/features/store/utils/store-resolver";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const code = getStoreCode(hostname);

  if (!code) {
    return {
      title: "Cart",
      description: "Your shopping cart",
    };
  }

  const store = await getStoreByCode(code);

  return {
    title: `Cart - ${store.name}`,
    description: `Your shopping cart at ${store.name}`,
  };
}

export default async function CartPage() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const code = getStoreCode(hostname);

  if (!code) {
    throw new Error("Invalid store subdomain");
  }

  const store = await getStoreByCode(code);
  const t = await getTranslations("cart");
  const locale = await getLocale();

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

      {/* Cart Content */}
      <section className="w-full max-w-full py-6 sm:py-8 md:py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items - Left Column */}
            <div className="lg:col-span-2">
              <CartList currency={store.currency} locale={locale} />
            </div>

            {/* Cart Summary - Right Column */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <CartSummary currency={store.currency} locale={locale} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
