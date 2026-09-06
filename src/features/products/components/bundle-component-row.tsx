import type { BundleComponentRowProps } from "@/features/products/types/BundleComponentRowProps";
import { Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BundleComponentRow({
  component,
  noImageLabel,
  quantityLabel,
  viewProductLabel,
}: BundleComponentRowProps) {
  const imageSrc = component.thumbnailUrl || component.imageUrl;
  const imageAlt = component.altText || component.displayName;

  return (
    <li>
      <article className="sf-panel flex items-center gap-3 rounded-xl border bg-card p-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center text-[10px] leading-tight text-muted-foreground"
              aria-hidden={!noImageLabel}
            >
              <Package className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>{noImageLabel}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {component.productId ? (
            <Link
              href={`/products/${component.productId}`}
              className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
              aria-label={viewProductLabel}
            >
              {component.displayName}
            </Link>
          ) : (
            <p className="truncate text-sm font-medium text-foreground">
              {component.displayName}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {quantityLabel}
          </p>
        </div>
      </article>
    </li>
  );
}
