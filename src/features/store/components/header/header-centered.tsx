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

interface HeaderCenteredProps {
  store: PublicStoreDto;
}

/**
 * CENTERED header — boutique/hospitality feel: the brand sits centered
 * with actions split to both sides, and the navigation gets its own
 * centered row on desktop.
 */
export function HeaderCentered({ store }: HeaderCenteredProps) {
  const t = useTranslations();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
        <div className="container grid h-16 sm:h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* Start actions */}
          <div className="flex items-center gap-1 sm:gap-2 justify-self-start">
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
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

          {/* Centered brand */}
          <div className="justify-self-center min-w-0 max-w-full">
            <HeaderBrand store={store} isCentered />
          </div>

          {/* End actions */}
          <div className="flex items-center gap-1 sm:gap-2 justify-self-end">
            <Link href="/products">
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
            <HeaderCartButton />
          </div>
        </div>

        {/* Centered navigation row - desktop only */}
        <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 pb-3">
          <HeaderNavLinks />
        </nav>
      </header>

      {/* Mobile Settings Sheet */}
      <MobileSettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
