"use client";

import {
  getRecentlyViewedServerSnapshot,
  getRecentlyViewedSnapshot,
  RecentlyViewedEntry,
  recordRecentlyViewed,
  subscribeRecentlyViewed,
} from "@/lib/recently-viewed";
import { formatCurrency } from "@/lib/utils/formatters";
import { History } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

interface RecentlyViewedSectionProps {
  currency: string;
  /**
   * Product currently being viewed (product detail page). It is recorded
   * to the history and excluded from the strip. Omit on other pages.
   */
  current?: Omit<RecentlyViewedEntry, "viewedAt">;
}

/**
 * Horizontal strip of recently-viewed products — reads localStorage via
 * useSyncExternalStore (renders after hydration, no mismatch) and renders
 * nothing when there is no history.
 */
export function RecentlyViewedSection({
  currency,
  current,
}: RecentlyViewedSectionProps) {
  const t = useTranslations("store.recentlyViewed");
  const locale = useLocale();

  const allEntries = useSyncExternalStore(
    subscribeRecentlyViewed,
    getRecentlyViewedSnapshot,
    getRecentlyViewedServerSnapshot,
  );

  // The product being viewed right now never shows in its own strip
  const entries = useMemo(
    () => allEntries.filter((entry) => entry.id !== current?.id),
    [allEntries, current?.id],
  );

  // Record the view AFTER paint — an external-system write, not state
  useEffect(() => {
    if (current) {
      recordRecentlyViewed(current);
    }
  }, [current]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full py-6 sm:py-8">
      <div className="container space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg sm:text-xl font-semibold">{t("title")}</h2>
        </div>

        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/products/${entry.id}`}
              className="group shrink-0 w-32 sm:w-40 snap-start touch-manipulation active:scale-[0.98] transition-transform duration-150"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                {entry.imageUrl ? (
                  <RecentlyViewedImage
                    imageUrl={entry.imageUrl}
                    alt={entry.name}
                  />
                ) : (
                  <ImagePlaceholder name={entry.name} />
                )}
              </div>
              <p className="line-clamp-2 text-xs sm:text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                {entry.name}
              </p>
              {typeof entry.price === "number" && entry.price > 0 && (
                <p className="text-xs sm:text-sm font-bold mt-0.5">
                  {formatCurrency(entry.price, currency, locale)}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Image with graceful fallback — presigned URLs stored in localStorage
 * expire, so a failed load swaps to the placeholder instead of a broken
 * image icon.
 */
function RecentlyViewedImage({
  imageUrl,
  alt,
}: {
  imageUrl: string;
  alt: string;
}) {
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return <ImagePlaceholder name={alt} />;
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      sizes="160px"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      onError={() => setHasFailed(true)}
    />
  );
}

function ImagePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-muted">
      <span className="text-2xl font-semibold text-muted-foreground/60">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
