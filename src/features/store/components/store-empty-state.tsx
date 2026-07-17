import { Store } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface StoreEmptyStateProps {
  storeName: string;
}

/**
 * Empty state displayed when a store has no products or categories yet.
 * Calm, honest copy — no fake feature chips or refresh buttons.
 */
export async function StoreEmptyState({ storeName }: StoreEmptyStateProps) {
  const t = await getTranslations("store.emptyStore");

  return (
    <section className="w-full py-20 sm:py-28">
      <div className="container">
        <div className="max-w-md mx-auto text-center space-y-5">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t("title", { storeName })}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
