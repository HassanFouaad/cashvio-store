"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileSettingsSheet } from "@/components/mobile-settings-sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Search, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { PublicStoreDto } from "../../types/store.types";
import { HeaderBrand } from "./header-brand";
import { HeaderCartButton } from "./header-cart-button";
import { HeaderNavLinks } from "./header-nav-links";

interface HeaderMinimalProps {
  store: PublicStoreDto;
}

/**
 * MINIMAL header — slim editorial bar: compact brand, uppercase
 * micro-navigation, tight actions. No blur, plain hairline border.
 */
export function HeaderMinimal({ store }: HeaderMinimalProps) {
  const t = useTranslations();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background overflow-hidden">
        <div className="container flex h-12 sm:h-14 items-center justify-between gap-3">
          <HeaderBrand store={store} isCompact />

          {/* Editorial micro-navigation - desktop only */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            <HeaderNavLinks isUppercase />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Link href="/products" className="hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                title={t("common.search")}
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">{t("common.search")}</span>
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-0.5 sm:gap-1">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <HeaderCartButton />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
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
