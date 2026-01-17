"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { StoreFrontHeroImageDto } from "../types/store.types";

interface StoreHeroProps {
  heroImages: StoreFrontHeroImageDto[];
  storeName: string;
}

export function StoreHero({ heroImages, storeName }: StoreHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort images by display order
  const sortedImages = [...heroImages].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  useEffect(() => {
    if (sortedImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer);
  }, [sortedImages.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  };

  if (sortedImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 relative w-full max-w-full h-[250px] sm:h-[350px] md:h-[450px] overflow-hidden group bg-background">
      {/* Images */}
      {sortedImages.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={image.imageUrl}
            alt={`${storeName} hero image ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
          />
        </div>
      ))}

      {/* Overlay - Removed to show clean background */}

      {/* Navigation Buttons */}
      {sortedImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute start-2 sm:start-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-10 sm:w-10"
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 rtl:rotate-180" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute end-2 sm:end-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-10 sm:w-10"
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 rtl:rotate-180" />
          </Button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {sortedImages.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-6 sm:w-8 bg-white"
                    : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/75"
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
