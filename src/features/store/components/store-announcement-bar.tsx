import { getLocale } from "next-intl/server";
import { Locale } from "@/types/enums";
import { PublicStoreDto } from "../types/store.types";

interface StoreAnnouncementBarProps {
  store: PublicStoreDto;
}

/**
 * Announcement/promo bar rendered above the sticky header.
 * Text is tenant-configured per language; falls back to the other
 * language when only one is set. Renders nothing when no text exists.
 */
export async function StoreAnnouncementBar({
  store,
}: StoreAnnouncementBarProps) {
  const locale = await getLocale();
  const storeFront = store.storeFront;

  const text =
    locale === Locale.ARABIC
      ? storeFront?.announcementTextAr || storeFront?.announcementTextEn
      : storeFront?.announcementTextEn || storeFront?.announcementTextAr;

  if (!text?.trim()) {
    return null;
  }

  return (
    <div
      role="status"
      className="w-full bg-primary text-primary-foreground overflow-hidden"
    >
      <div className="container py-1.5 sm:py-2">
        <p className="text-center text-xs sm:text-sm font-medium leading-snug break-words">
          {text}
        </p>
      </div>
    </div>
  );
}
