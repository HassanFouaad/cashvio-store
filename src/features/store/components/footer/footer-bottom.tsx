import { buildPoweredByUrl } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import { PublicStoreDto } from "../../types/store.types";

interface FooterBottomProps {
  store: PublicStoreDto;
}

/**
 * Custom footer text + copyright + "Powered by Cashvio" attribution —
 * the shared bottom block of every footer variant.
 */
export async function FooterBottom({ store }: FooterBottomProps) {
  const t = await getTranslations();
  const locale = await getLocale();
  // Use a stable year value to avoid hydration mismatches
  const currentYear = new Date().getUTCFullYear();

  // Tenant-configured footer text — per-language with cross-language fallback
  const customFooterText = (
    locale === "ar"
      ? store.storeFront?.footerTextAr || store.storeFront?.footerTextEn
      : store.storeFront?.footerTextEn || store.storeFront?.footerTextAr
  )?.trim();

  return (
    <div className="text-center w-full space-y-2">
      {customFooterText && (
        <p className="text-xs sm:text-sm text-muted-foreground break-words leading-relaxed whitespace-pre-line">
          {customFooterText}
        </p>
      )}
      <p className="text-[10px] sm:text-xs text-muted-foreground break-words leading-relaxed">
        {t("footer.copyright", {
          year: currentYear,
          storeName: store.name,
        })}
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground/70">
        {t("footer.poweredBy")}{" "}
        <a
          href={buildPoweredByUrl("storefront_footer")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Cashvio
        </a>
        {" · "}
        <a
          href={buildPoweredByUrl("storefront_footer")}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("footer.poweredByCta")}
        </a>
      </p>
    </div>
  );
}
