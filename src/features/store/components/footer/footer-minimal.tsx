import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { getStaticPages } from "../../api/get-static-pages";
import { PublicStoreDto } from "../../types/store.types";
import { FooterBottom } from "./footer-bottom";
import { FooterSocialRow } from "./footer-social-row";

interface FooterMinimalProps {
  store: PublicStoreDto;
}

/**
 * MINIMAL footer — one slim editorial band: brand and social on one row,
 * a compact link row, and the attribution block. Plain background,
 * hairline border, maximum whitespace.
 */
export async function FooterMinimal({ store }: FooterMinimalProps) {
  const t = await getTranslations();
  const locale = await getLocale();
  const socialMedia = store.storeFront?.socialMedia;
  const staticPages = await getStaticPages(store.id, locale);

  const linkClass =
    "text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors";

  return (
    <footer className="w-full max-w-full border-t bg-background overflow-hidden py-6 sm:py-8">
      <div className="container flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm sm:text-base font-semibold break-words">
            {store.name}
          </h3>
          {socialMedia && <FooterSocialRow socialMedia={socialMedia} />}
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
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

        <div className="border-t pt-4">
          <FooterBottom store={store} />
        </div>
      </div>
    </footer>
  );
}
