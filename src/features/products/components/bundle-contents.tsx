import { BundleComponentRow } from "@/features/products/components/bundle-component-row";
import type { BundleContentsProps } from "@/features/products/types/BundleContentsProps";
import { BundleUtils } from "@/features/products/utils/bundle.utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { getTranslations } from "next-intl/server";

export async function BundleContents({
  variant,
  currency,
  locale,
}: BundleContentsProps) {
  if (!BundleUtils.isBundleVariant(variant)) {
    return null;
  }

  const t = await getTranslations("store.products.bundle");
  const components = BundleUtils.getBundleComponents(variant);
  if (components.length === 0) {
    return null;
  }

  const savings = BundleUtils.getBundleSavings(variant);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{t("whatsInside")}</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {components.map((component) => (
          <BundleComponentRow
            key={`${component.productId ?? component.displayName}-${component.quantity}`}
            component={component}
            noImageLabel={t("noImage")}
            quantityLabel={t("quantityLabel", { quantity: component.quantity })}
            viewProductLabel={t("viewComponent", {
              name: component.displayName,
            })}
          />
        ))}
      </ul>
      {savings != null && savings > 0 && (
        <p className="text-sm font-medium text-primary">
          {t("savings", {
            amount: formatCurrency(savings, currency, locale),
          })}
        </p>
      )}
    </section>
  );
}
