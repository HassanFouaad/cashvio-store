import { cn } from "@/lib/utils/cn";
import { getTranslations } from "next-intl/server";

interface BundleBadgeProps {
  className?: string;
}

export async function BundleBadge({ className }: BundleBadgeProps) {
  const t = await getTranslations("store.products.bundle");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground",
        className,
      )}
    >
      {t("badge")}
    </span>
  );
}
