"use client";

import { Button } from "@/components/ui/button";
import { Package, Sparkles, Store } from "lucide-react";
import { useTranslations } from "next-intl";

interface StoreEmptyStateProps {
  storeName: string;
}

/**
 * Empty state displayed when a store has no products or categories yet
 * Beautiful, welcoming design that reassures visitors
 */
export function StoreEmptyState({ storeName }: StoreEmptyStateProps) {
  const t = useTranslations("store.emptyStore");

  return (
    <section className="w-full py-16 sm:py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Icon Group */}
          <div className="flex justify-center items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-full border border-primary/10">
                <Store className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {t("title", { storeName })}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-start">
                <p className="text-sm font-medium">{t("feature1Title")}</p>
                <p className="text-xs text-muted-foreground">{t("feature1Description")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-start">
                <p className="text-sm font-medium">{t("feature2Title")}</p>
                <p className="text-xs text-muted-foreground">{t("feature2Description")}</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              {t("refreshButton")}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground/70 pt-4">
            {t("footerNote")}
          </p>
        </div>
      </div>
    </section>
  );
}

