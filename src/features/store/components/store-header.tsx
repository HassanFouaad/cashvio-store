"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileSettingsSheet } from "@/components/mobile-settings-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useCartItemCount } from "@/features/cart/store";
import { Settings, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PublicStoreDto } from "../types/store.types";

interface StoreHeaderProps {
  store: PublicStoreDto;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const t = useTranslations();
  const logoUrl = store.storeFront?.logoUrl;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Get cart item count from Zustand store
  const cartItemCount = useCartItemCount();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          {/* Logo and Store Name */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden"
            title={store.name}
          >
            {logoUrl ? (
              <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-md shrink-0">
                <Image
                  src={logoUrl}
                  alt={`${store.name} logo`}
                  fill
                  sizes="(max-width: 640px) 32px, 40px"
                  className="object-contain"
                  priority
                  loading="eager"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm sm:text-lg shrink-0">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-base sm:text-xl font-bold truncate md:max-w-none">
              {store.name}
            </span>
          </Link>

          {/* Navigation - Desktop only */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary whitespace-nowrap"
            >
              {t("common.home")}
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium transition-colors hover:text-primary whitespace-nowrap"
            >
              {t("common.collections")}
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium transition-colors hover:text-primary whitespace-nowrap"
            >
              {t("common.products")}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Desktop: Theme and Language toggles */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            {/* Desktop: Cart button (mobile uses bottom nav) */}
            <Link href="/cart" className="hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10"
                title={t("store.shoppingCart")}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">{t("store.shoppingCart")}</span>
                {/* Cart badge */}
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile: Settings button for theme/language */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setIsSettingsOpen(true)}
              title={t("common.settings")}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">{t("common.settings")}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Settings Sheet */}
      <MobileSettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
