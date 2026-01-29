'use client';

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store";
import { CartItem as CartItemType } from "@/features/cart/types/cart.types";
import { formatCurrency } from "@/lib/utils/formatters";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

interface CartItemProps {
  item: CartItemType;
  currency: string;
  locale: string;
}

/**
 * Single cart item component
 * Displays product info, quantity controls, and remove button
 * Client component - requires interactivity
 */
export function CartItem({ item, currency, locale }: CartItemProps) {
  const t = useTranslations("cart");
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity >= 1 && newQuantity <= item.maxQuantity) {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  const itemTotal = item.unitPrice * item.quantity;

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <Link
        href={`/products/${item.productId}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-muted"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            {t("noImage")}
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-1">
          <Link
            href={`/products/${item.productId}`}
            className="font-medium text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors"
          >
            {item.productName}
          </Link>
          
          {item.variantName && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {item.variantName}
            </p>
          )}

          <p className="text-sm font-semibold">
            {formatCurrency(item.unitPrice, currency, locale)}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(-1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <span className="min-w-[2rem] text-center text-sm font-medium">
              {item.quantity}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(1)}
              disabled={item.quantity >= item.maxQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">
              {formatCurrency(itemTotal, currency, locale)}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t("remove")}</span>
            </Button>
          </div>
        </div>

        {/* Stock Warning */}
        {!item.inStock && (
          <p className="text-xs text-destructive mt-1">
            {t("outOfStock")}
          </p>
        )}
        
        {item.inStock && item.quantity >= item.maxQuantity && (
          <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
            {t("maxQuantityReached")}
          </p>
        )}
      </div>
    </div>
  );
}
