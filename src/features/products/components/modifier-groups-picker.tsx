"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { PublicModifierGroupDto } from "@/features/products/types/product.types";
import { formatCurrency } from "@/lib/utils/formatters";

interface ModifierGroupsPickerProps {
  groups: PublicModifierGroupDto[];
  selectedIds: Set<string>;
  selectedCountByGroup: Map<string, number>;
  onToggle: (group: PublicModifierGroupDto, modifierId: string) => void;
  currency: string;
  locale: string;
}

/**
 * Add-on picker sections on the product page: one section per modifier
 * group with the selection rule spelled out, touch-first option buttons
 * matching the variant selector style, and price deltas on each option.
 */
export function ModifierGroupsPicker({
  groups,
  selectedIds,
  selectedCountByGroup,
  onToggle,
  currency,
  locale,
}: ModifierGroupsPickerProps) {
  const t = useTranslations("store.products.modifiers");

  const describeRule = (group: PublicModifierGroupDto): string => {
    const requirement =
      group.minSelections > 0
        ? t("pickAtLeast", { count: group.minSelections })
        : t("optional");
    if (group.maxSelections === null) {
      return requirement;
    }
    return `${requirement} · ${t("upTo", { count: group.maxSelections })}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {groups.map((group) => {
        const selectedCount = selectedCountByGroup.get(group.id) ?? 0;
        const isBelowMin = selectedCount < group.minSelections;
        const isAtMax =
          group.maxSelections !== null &&
          group.maxSelections > 1 &&
          selectedCount >= group.maxSelections;

        return (
          <div key={group.id} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">{group.name}</h2>
              <span
                className={`text-xs ${
                  isBelowMin
                    ? "font-medium text-amber-600 dark:text-amber-500"
                    : "text-muted-foreground"
                }`}
              >
                {describeRule(group)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {group.modifiers.map((modifier) => {
                const isSelected = selectedIds.has(modifier.id);
                const isBlocked = !isSelected && isAtMax;

                return (
                  <button
                    key={modifier.id}
                    type="button"
                    onClick={() => onToggle(group, modifier.id)}
                    disabled={isBlocked}
                    aria-pressed={isSelected}
                    className={`relative flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 text-sm rounded-lg border-2 text-start transition-all touch-manipulation ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    } ${
                      isBlocked
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer active:scale-[0.98]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {modifier.name}
                      </span>
                      <span
                        className={`block text-xs ${
                          modifier.priceDelta > 0
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {modifier.priceDelta > 0
                          ? `+${formatCurrency(modifier.priceDelta, currency, locale)}`
                          : t("free")}
                      </span>
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
