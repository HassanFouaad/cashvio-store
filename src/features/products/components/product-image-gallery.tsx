'use client';

import { PublicProductImageDto } from "@/features/products/types/product.types";
import Image from "next/image";
import { useState } from "react";

interface ProductImageGalleryProps {
  images: PublicProductImageDto[];
  productName: string;
  noImageText: string;
}

/**
 * Client component for interactive image gallery
 * Handles image selection/thumbnails
 */
export function ProductImageGallery({
  images,
  productName,
  noImageText,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const currentImage = images[selectedImageIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
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
            <span>{noImageText}</span>
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={image.imageUrl ?? index}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                index === selectedImageIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <Image
                src={image.thumbnailUrl || image.imageUrl}
                alt={image.altText || `${productName} ${index + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
