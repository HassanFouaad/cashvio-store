import { Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { getStaticPages } from "../../api/get-static-pages";
import { PublicStoreDto } from "../../types/store.types";
import { FooterBottom } from "./footer-bottom";
import { FooterSocialRow } from "./footer-social-row";

interface FooterClassicProps {
  store: PublicStoreDto;
}

/**
 * CLASSIC footer — the storefront's original four-column footer,
 * byte-compatible for stores without a theme.
 */
export async function FooterClassic({ store }: FooterClassicProps) {
  const t = await getTranslations();
  const locale = await getLocale();
  const socialMedia = store.storeFront?.socialMedia;

  // Fetch static pages for the store
  const staticPages = await getStaticPages(store.id, locale);

  return (
    <footer className="w-full max-w-full border-t bg-muted/50 overflow-hidden py-6 sm:py-10">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 w-full">
          {/* Store Info */}
          <div className="w-full">
            <h3 className="font-bold text-sm sm:text-base mb-2 sm:mb-3 break-words">
              {store.name}
            </h3>
            {(store.addressLine1 ||
              store.addressLine2 ||
              store.city?.name ||
              store.country?.name) && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 space-y-0.5">
                {store.addressLine1 && (
                  <span className="block break-words">
                    {store.addressLine1}
                  </span>
                )}
                {store.addressLine2 && (
                  <span className="block break-words">
                    {store.addressLine2}
                  </span>
                )}
                {(store.city?.name || store.country?.name) && (
                  <span className="block break-words">
                    {[store.city?.name, store.country?.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </p>
            )}
            {socialMedia?.contactPhone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="break-all">{socialMedia.contactPhone}</span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="w-full">
            <h3 className="font-bold text-sm sm:text-base mb-2 sm:mb-3">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("common.home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("common.collections")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("common.products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("common.trackOrder")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Policy Pages / Static Pages */}
          {staticPages.length > 0 && (
            <div className="w-full">
              <h3 className="font-bold text-sm sm:text-base mb-2 sm:mb-3">
                {t("footer.policies")}
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {staticPages.map((page) => (
                  <li key={page.id}>
                    <Link
                      href={`/pages/${page.slug}`}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social Media */}
          {socialMedia && (
            <div className="w-full sm:col-span-2 md:col-span-1">
              <h3 className="font-bold text-sm sm:text-base mb-2 sm:mb-3">
                {t("footer.connectWithUs")}
              </h3>
              <FooterSocialRow socialMedia={socialMedia} />
            </div>
          )}
        </div>

        <div className="mt-5 sm:mt-8 pt-5 sm:pt-8 border-t">
          <FooterBottom store={store} />
        </div>
      </div>
    </footer>
  );
}
