"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { useHeroCarousel } from "@/features/store/hooks/use-hero-carousel";
import type { StoreFrontHeroImageDto } from "@/features/store/types/store.types";
import { getHeroImageLoadingProps } from "@/features/store/utils/hero-image-props";

import { HeroControls } from "./hero-controls";
import { HeroLink } from "./hero-link";

interface HeroFullBleedProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
  titleClassName?: string;
}

/** Immersive imagery with legible content and the current banner's real CTA. */
export function HeroFullBleed({
  heroImages,
  storeName,
  titleClassName = "text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight",
}: HeroFullBleedProps) {
  const t = useTranslations("store.hero");
  const carousel = useHeroCarousel(heroImages);
  if (!carousel.images.length) return null;
  const activeImage = carousel.images[carousel.currentIndex];

  return (
    <section
      role="region"
      aria-roledescription={t("carouselRole")}
      aria-label={t("carouselLabel", { storeName })}
      className="relative h-[380px] w-full max-w-full overflow-hidden sm:h-[460px] md:h-[560px]"
      {...carousel.interactionProps}
    >
      {carousel.images.map((image, index) => {
        const isActive = index === carousel.currentIndex;
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
            {carousel.shouldRenderImage(index) && (
              <Image
                src={image.imageUrl}
                alt={t("imageAlt", { storeName, index: index + 1 })}
                fill
                sizes="100vw"
                className="object-cover"
                {...getHeroImageLoadingProps(index, carousel.currentIndex)}
              />
            )}
          </div>
        );
      })}
      <div className="absolute inset-0 bg-media-scrim/60" aria-hidden="true" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 pb-16 text-center sm:gap-5">
        <h1 className={`max-w-3xl ${titleClassName} text-media-foreground`}>
          {storeName}
        </h1>
        <p className="max-w-xl text-sm text-media-foreground/90 sm:text-lg">
          {t("tagline")}
        </p>
        <div className="rounded-md bg-background">
          <HeroLink
            href={activeImage.linkUrl || "/products"}
            className={buttonVariants({ size: "lg" })}
          >
            {t("shopNow")}
          </HeroLink>
        </div>
      </div>
      <HeroControls {...carousel} count={carousel.images.length} />
    </section>
  );
}
