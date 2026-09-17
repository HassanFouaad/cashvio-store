"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { useHeroCarousel } from "@/features/store/hooks/use-hero-carousel";
import type { StoreFrontHeroImageDto } from "@/features/store/types/store.types";
import { getHeroImageLoadingProps } from "@/features/store/utils/hero-image-props";

import { HeroControls } from "./hero-controls";
import { HeroLink } from "./hero-link";

interface HeroSplitProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
  titleClassName?: string;
}

/** Direction-aware editorial split, with every banner reachable by controls. */
export function HeroSplit({
  heroImages,
  storeName,
  titleClassName = "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight",
}: HeroSplitProps) {
  const t = useTranslations("store.hero");
  const carousel = useHeroCarousel(heroImages);
  if (!carousel.images.length) return null;

  return (
    <section
      role="region"
      aria-roledescription={t("carouselRole")}
      aria-label={t("carouselLabel", { storeName })}
      className="w-full max-w-full overflow-hidden bg-secondary/40"
      {...carousel.interactionProps}
    >
      <div className="container grid gap-6 py-8 md:grid-cols-2 md:items-center md:gap-10 md:py-14">
        <div className="flex flex-col items-start gap-3 text-start md:gap-5">
          <h1 className={`${titleClassName} leading-tight`}>{storeName}</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {t("tagline")}
          </p>
          <HeroLink href="/products" className={buttonVariants({ size: "lg" })}>
            {t("shopNow")}
          </HeroLink>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          {carousel.images.map((image, index) => {
            const isActive = index === carousel.currentIndex;
            const imageContent = carousel.shouldRenderImage(index) ? (
              <Image
                src={image.imageUrl}
                alt={t("imageAlt", { storeName, index: index + 1 })}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                {...getHeroImageLoadingProps(index, carousel.currentIndex)}
              />
            ) : null;
            return (
              <div
                key={image.id}
                role="group"
                aria-roledescription={t("slideRole")}
                aria-label={t("slidePosition", {
                  index: index + 1,
                  total: carousel.images.length,
                })}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
              >
                {image.linkUrl ? (
                  <HeroLink
                    href={image.linkUrl}
                    className="absolute inset-0 block"
                    label={t("promotionLabel", { storeName })}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {imageContent}
                  </HeroLink>
                ) : (
                  imageContent
                )}
              </div>
            );
          })}
          <HeroControls {...carousel} count={carousel.images.length} />
        </div>
      </div>
    </section>
  );
}
