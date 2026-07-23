"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

interface HeaderNavLinksProps {
  /** Editorial uppercase micro-labels (MINIMAL header) */
  isUppercase?: boolean;
}

/**
 * Home / Collections / Products navigation shared by header variants
 * (desktop only — mobile navigation lives in the bottom bar).
 */
export function HeaderNavLinks({ isUppercase }: HeaderNavLinksProps) {
  const t = useTranslations();
  const linkClass = isUppercase
    ? "text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:text-primary whitespace-nowrap"
    : "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap";

  return (
    <>
      <Link href="/" className={linkClass}>
        {t("common.home")}
      </Link>
      <Link href="/categories" className={linkClass}>
        {t("common.collections")}
      </Link>
      <Link href="/products" className={linkClass}>
        {t("common.products")}
      </Link>
    </>
  );
}
