"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";
import { ChevronLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PublicProductDto } from "@/features/products/types/product.types";
import { findVariantById, sortProductImages } from "@/features/products/utils/product-helpers";

interface ProductDetailsProps {
  product: PublicProductDto;
  currency: string;
  storeCode: string;
  locale: string;
}

export function ProductDetails({
  product,
  currency,
  storeCode,
  locale,
}: ProductDetailsProps) {
  const t = useTranslations("store.products");

  // State
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id || null
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Use utility functions
  const selectedVariant = findVariantById(
    product.variants,
    selectedVariantId || ""
  );
  const sortedImages = sortProductImages(product.images);
  const currentImage = sortedImages[selectedImageIndex];

  // Handlers
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxQuantity = selectedVariant?.availableQuantity || 0;

    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const isInStock = selectedVariant?.inStock || false;
  const canAddToCart = isInStock && quantity > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back button */}
      <Link
        href={`/store/${storeCode}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        {t("backToStore", { defaultValue: "Back to store" })}
      </Link>

      {/* Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Left Column - Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {currentImage ? (
              <Image
                src={currentImage.imageUrl}
                alt={currentImage.altText || product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <span>{t("noImageAvailable")}</span>
              </div>
            )}
          </div>

          {/* Thumbnail Grid */}
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
              {sortedImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                    index === selectedImageIndex
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <Image
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={image.altText || `${product.name} ${index + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          {/* Product Title & Price */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>

            {selectedVariant && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(
                    selectedVariant.sellingPrice,
                    currency,
                    locale
                  )}
                </span>
                {product.taxIncluded && product.taxRate && (
                  <span className="text-sm text-muted-foreground">
                    ({t("taxIncluded")})
                  </span>
                )}
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isInStock ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  isInStock
                    ? "text-green-600 dark:text-green-500"
                    : "text-red-600 dark:text-red-500"
                }`}
              >
                {isInStock ? t("inStock") : t("outOfStock")}
              </span>
              {isInStock && selectedVariant && (
                <span className="text-sm text-muted-foreground">
                  ({selectedVariant.availableQuantity} {t("available")})
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t("description")}</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Variant Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">{t("selectVariant")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedVariantId(variant.id);
                      setQuantity(1);
                    }}
                    disabled={!variant.inStock}
                    className={`relative px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                      variant.id === selectedVariantId
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    } ${
                      !variant.inStock
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="font-medium">{variant.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(variant.sellingPrice, currency, locale)}
                    </div>
                    {!variant.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-destructive">
                        {t("outOfStock")}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {isInStock && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">{t("quantity")}</h2>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] text-center text-lg font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={
                    quantity >= (selectedVariant?.availableQuantity || 0)
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button size="lg" className="w-full gap-2" disabled={!canAddToCart}>
            <ShoppingCart className="h-5 w-5" />
            {t("addToCart")}
          </Button>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
