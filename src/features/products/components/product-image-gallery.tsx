"use client";

import { PublicProductImageDto } from "@/features/products/types/product.types";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface ProductImageGalleryProps {
  images: PublicProductImageDto[];
  productName: string;
  noImageText: string;
}

/**
 * Client component for interactive image gallery
 * Mobile: swipeable carousel with dot indicators
 * Desktop: click-to-select thumbnails
 */
export function ProductImageGallery({
  images,
  productName,
  noImageText,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const currentImage = images[selectedImageIndex];
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && selectedImageIndex < images.length - 1) {
        // Swipe left -> next image
        setSelectedImageIndex((prev) => prev + 1);
      } else if (diff < 0 && selectedImageIndex > 0) {
        // Swipe right -> prev image
        setSelectedImageIndex((prev) => prev - 1);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }, [selectedImageIndex, images.length]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-xl bg-muted"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentImage ? (
          <Image
            src={currentImage.imageUrl}
            alt={currentImage.altText || productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-sm">{noImageText}</span>
          </div>
        )}

        {/* Image counter badge (mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 end-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full sm:hidden backdrop-blur-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Mobile: Dot Indicators */}
      {images.length > 1 && (
        <div
          className="flex justify-center gap-1.5 sm:hidden"
          role="tablist"
          aria-label="Image selector"
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              role="tab"
              aria-selected={index === selectedImageIndex}
              aria-label={`Image ${index + 1}`}
              className={`rounded-full transition-all duration-200 ${
                index === selectedImageIndex
                  ? "w-6 h-2 bg-foreground"
                  : "w-2 h-2 bg-foreground/25"
              }`}
            />
          ))}
        </div>
      )}

      {/* Desktop: Thumbnail Grid */}
      {images.length > 1 && (
        <div
          className="hidden sm:grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3"
          role="tablist"
          aria-label="Image thumbnails"
        >
          {images.map((image, index) => (
            <button
              key={image.imageUrl ?? index}
              onClick={() => setSelectedImageIndex(index)}
              role="tab"
              aria-selected={index === selectedImageIndex}
              aria-label={image.altText || `${productName} image ${index + 1}`}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                index === selectedImageIndex
                  ? "border-foreground ring-1 ring-foreground/20"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <Image
                src={image.thumbnailUrl || image.imageUrl}
                alt={image.altText || `${productName} ${index + 1}`}
                fill
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
