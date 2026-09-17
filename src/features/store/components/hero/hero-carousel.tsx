"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { useHeroCarousel } from "@/features/store/hooks/use-hero-carousel";
import type { StoreFrontHeroImageDto } from "@/features/store/types/store.types";
import { getHeroImageLoadingProps } from "@/features/store/utils/hero-image-props";

import { HeroControls } from "./hero-controls";
import { HeroLink } from "./hero-link";

interface HeroCarouselProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
}

/** Image-led carousel preserves the merchant's uncropped banner artwork. */
export function HeroCarousel({ heroImages, storeName }: HeroCarouselProps) {
  const t = useTranslations("store.hero");
  const carousel = useHeroCarousel(heroImages);
  if (!carousel.images.length) return null;

  return (
    <section
      role="region"
      aria-roledescription={t("carouselRole")}
      aria-label={t("carouselLabel", { storeName })}
      className="relative h-[250px] w-full max-w-full overflow-hidden bg-background sm:h-[350px] md:h-[450px]"
      {...carousel.interactionProps}
    >
      {carousel.images.map((image, index) => {
        const isActive = index === carousel.currentIndex;
        const imageContent = carousel.shouldRenderImage(index) ? (
          <Image
            src={image.imageUrl}
            alt={t("imageAlt", { storeName, index: index + 1 })}
            fill
            sizes="100vw"
            className="object-contain"
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
    </section>
  );
}
