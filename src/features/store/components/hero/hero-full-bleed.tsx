"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreFrontHeroImageDto } from "../../types/store.types";

interface HeroFullBleedProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
}

/**
 * FULL_BLEED hero — immersive edge-to-edge imagery with the store name,
 * tagline, and shop CTA overlaid. Rotates gently through banners.
 */
export function HeroFullBleed({ heroImages, storeName }: HeroFullBleedProps) {
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
    <section className="relative w-full max-w-full h-[380px] sm:h-[460px] md:h-[560px] overflow-hidden">
      {/* Rotating background imagery */}
      {sortedImages.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={index !== currentIndex}
        >
          <Image
            src={image.imageUrl}
            alt={t("imageAlt", { storeName, index: index + 1 })}
            fill
            sizes="100vw"
            className="object-cover"
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
          />
        </div>
      ))}

      {/* Legibility overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />

      {/* Overlaid content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-5 px-4 text-center">
        <h1 className="max-w-3xl text-3xl font-bold text-white drop-shadow-sm sm:text-5xl md:text-6xl">
          {storeName}
        </h1>
        <p className="max-w-xl text-sm text-white/85 sm:text-lg">
          {t("tagline")}
        </p>
        <Link href="/products">
          <Button size="lg">{t("shopNow")}</Button>
        </Link>
      </div>

      {/* Dots Indicator */}
      {sortedImages.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              className={`h-1.5 sm:h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 sm:w-8 bg-white"
                  : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/75"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={t("goToImage", { index: index + 1 })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
