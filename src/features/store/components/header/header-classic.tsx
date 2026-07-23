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

interface HeaderClassicProps {
  store: PublicStoreDto;
}

/**
 * CLASSIC header — brand at the start, inline navigation, actions at the
 * end. This is the storefront's original header, byte-compatible for
 * stores without a theme.
 */
export function HeaderClassic({ store }: HeaderClassicProps) {
  const t = useTranslations();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
        <div className="container flex h-14 sm:h-16 items-center justify-between">
          <HeaderBrand store={store} />

          {/* Navigation - Desktop only */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <HeaderNavLinks />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Desktop: Search entry (products page hosts the search bar) */}
            <Link href="/products" className="hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
                title={t("common.search")}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">{t("common.search")}</span>
              </Button>
            </Link>

            {/* Desktop: Theme and Language toggles */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>

            {/* Desktop: Cart button (mobile uses bottom nav) */}
            <HeaderCartButton />

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
