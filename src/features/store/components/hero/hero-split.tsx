"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreFrontHeroImageDto } from "../../types/store.types";

interface HeroSplitProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
}

/**
 * SPLIT hero — welcoming half-and-half layout: store name, tagline, and a
 * shop CTA beside the banner imagery. Direction-aware (flips in RTL).
 * Every uploaded banner shows: the image side rotates gently through all
 * of them (same cadence as the other hero variants).
 */
export function HeroSplit({ heroImages, storeName }: HeroSplitProps) {
  const t = useTranslations("store.hero");
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedImages = [...heroImages].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  useEffect(() => {
    if (sortedImages.length <= 1) return;

    // Respect users who prefer reduced motion — no auto-rotation
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [sortedImages.length]);

  if (sortedImages.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full overflow-hidden bg-secondary/40">
      <div className="container grid gap-6 py-8 md:grid-cols-2 md:items-center md:gap-10 md:py-14">
        {/* Text block */}
        <div className="flex flex-col items-start gap-3 md:gap-5 text-start">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {storeName}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {t("tagline")}
          </p>
          <Link href="/products">
            <Button size="lg">{t("shopNow")}</Button>
          </Link>
        </div>

        {/* Rotating banner imagery */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
          {sortedImages.map((image, index) => {
            const isActive = index === currentIndex;
            const imageContent = (
              <Image
                src={image.imageUrl}
                alt={t("imageAlt", { storeName, index: index + 1 })}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
              />
            );

            return (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                aria-hidden={!isActive}
              >
                {image.linkUrl ? (
                  image.linkUrl.startsWith("/") ? (
                    <Link
                      href={image.linkUrl}
                      className="block absolute inset-0"
                      aria-label={t("promotionLabel", { storeName })}
                      tabIndex={isActive ? 0 : -1}
                    >
                      {imageContent}
                    </Link>
                  ) : (
                    <a
                      href={image.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block absolute inset-0"
                      aria-label={t("promotionLabel", { storeName })}
                      tabIndex={isActive ? 0 : -1}
                    >
                      {imageContent}
                    </a>
                  )
                ) : (
                  imageContent
                )}
              </div>
            );
          })}

          {/* Dots Indicator */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/75"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={t("goToImage", { index: index + 1 })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
