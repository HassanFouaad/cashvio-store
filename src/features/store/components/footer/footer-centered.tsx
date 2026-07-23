import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { getStaticPages } from "../../api/get-static-pages";
import { PublicStoreDto } from "../../types/store.types";
import { FooterBottom } from "./footer-bottom";
import { FooterSocialRow } from "./footer-social-row";

interface FooterCenteredProps {
  store: PublicStoreDto;
}

/**
 * CENTERED footer — hospitality/boutique feel: a stacked, center-aligned
 * identity block with the social row and one wrapping link row.
 */
export async function FooterCentered({ store }: FooterCenteredProps) {
  const t = await getTranslations();
  const locale = await getLocale();
  const socialMedia = store.storeFront?.socialMedia;
  const staticPages = await getStaticPages(store.id, locale);

  const linkClass =
    "text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors";

  return (
    <footer className="w-full max-w-full border-t bg-muted/50 overflow-hidden py-8 sm:py-12">
      <div className="container flex flex-col items-center gap-4 sm:gap-5 text-center">
        <h3 className="text-lg sm:text-xl font-bold break-words">
          {store.name}
        </h3>

        {(store.city?.name || store.country?.name) && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {[store.addressLine1, store.city?.name, store.country?.name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {socialMedia && (
          <FooterSocialRow socialMedia={socialMedia} isCentered />
        )}

        {/* One wrapping link row: quick links + policy pages */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/" className={linkClass}>
            {t("common.home")}
          </Link>
          <Link href="/categories" className={linkClass}>
            {t("common.collections")}
          </Link>
          <Link href="/products" className={linkClass}>
            {t("common.products")}
          </Link>
          <Link href="/track" className={linkClass}>
            {t("common.trackOrder")}
          </Link>
          {staticPages.map((page) => (
            <Link
              key={page.id}
              href={`/pages/${page.slug}`}
              className={linkClass}
            >
              {page.title}
            </Link>
          ))}
        </nav>

        <div className="w-full border-t pt-4 sm:pt-6">
          <FooterBottom store={store} />
        </div>
      </div>
    </footer>
  );
}
