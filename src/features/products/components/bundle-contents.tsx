import { PublicProductVariantDto } from "@/features/products/types/product.types";
import { BundleUtils } from "@/features/products/utils/bundle.utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { getTranslations } from "next-intl/server";

interface BundleContentsProps {
  variant: PublicProductVariantDto;
  currency: string;
  locale: string;
}

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
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {components.map((component, index) => (
          <li key={`bundle-component-${index}`}>
            {t("componentLine", {
              quantity: component.quantity,
              name: component.displayName,
            })}
          </li>
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
