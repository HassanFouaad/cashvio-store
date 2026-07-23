"use client";

import Image from "next/image";
import Link from "next/link";
import { PublicStoreDto } from "../../types/store.types";

interface HeaderBrandProps {
  store: PublicStoreDto;
  /** Compact logo/name sizing (MINIMAL header) */
  isCompact?: boolean;
  /** Center the brand instead of stretching to fill (CENTERED header) */
  isCentered?: boolean;
}

/**
 * Store logo + name link shared by every header variant.
 */
export function HeaderBrand({ store, isCompact, isCentered }: HeaderBrandProps) {
  const logoUrl = store.storeFront?.logoUrl;
  const logoSizing = isCompact
    ? "h-7 w-7 sm:h-8 sm:w-8"
    : "h-8 w-8 sm:h-10 sm:w-10";
  const nameSizing = isCompact
    ? "text-sm sm:text-base font-semibold"
    : "text-base sm:text-xl font-bold";

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden ${
        isCentered ? "justify-center" : "flex-1"
      }`}
      title={store.name}
    >
      {logoUrl ? (
        <div
          className={`relative ${logoSizing} overflow-hidden rounded-md shrink-0`}
        >
          <Image
            src={logoUrl}
            alt={`${store.name} logo`}
            fill
            sizes="(max-width: 640px) 32px, 40px"
            className="object-contain"
            priority
            loading="eager"
          />
        </div>
      ) : (
        <div
          className={`flex ${logoSizing} items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm sm:text-lg shrink-0`}
        >
          {store.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className={`${nameSizing} truncate md:max-w-none`}>
        {store.name}
      </span>
    </Link>
  );
}
