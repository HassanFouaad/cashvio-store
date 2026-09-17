import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface HeroLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  label?: string;
  tabIndex?: number;
}

/** Merchant banners support local paths or HTTP(S), never executable URLs. */
export function HeroLink({
  href,
  children,
  className,
  label,
  tabIndex,
}: HeroLinkProps): ReactElement {
  const linkClassName = cn(
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    className,
  );
  const destination = href.trim();
  const isInternal =
    destination.startsWith("/") &&
    !destination.startsWith("//") &&
    !destination.includes("\\");
  if (isInternal) {
    return (
      <Link
        href={destination}
        className={linkClassName}
        aria-label={label}
        tabIndex={tabIndex}
      >
        {children}
      </Link>
    );
  }

  let isExternal = false;
  try {
    const url = new URL(destination);
    isExternal = url.protocol === "https:" || url.protocol === "http:";
  } catch {
    // Invalid legacy values fall back to the catalog without breaking browsing.
  }
  if (isExternal) {
    return (
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        aria-label={label}
        tabIndex={tabIndex}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href="/products"
      className={linkClassName}
      aria-label={label}
      tabIndex={tabIndex}
    >
      {children}
    </Link>
  );
}
