import type { ReactElement } from "react";

import { cn } from "@/lib/utils/cn";
import {
  formatCurrencyAmount,
  getCurrencyLabel,
  isArabicCurrencyLocale,
} from "@/lib/utils/formatters";

interface MoneyProps {
  amount: number;
  currency: string;
  locale: string;
  maximumAmount?: number;
  showPlusSign?: boolean;
  className?: string;
}

export function Money({
  amount,
  currency,
  locale,
  maximumAmount,
  showPlusSign = false,
  className,
}: MoneyProps): ReactElement {
  const formattedAmount = formatCurrencyAmount(amount, currency, showPlusSign);
  const formattedMaximum =
    maximumAmount == null || maximumAmount === amount
      ? formattedAmount
      : formatCurrencyAmount(maximumAmount, currency);

  return (
    <bdi
      className={cn("sf-price", className)}
      dir={isArabicCurrencyLocale(locale) ? "rtl" : "ltr"}
      lang={locale}
    >
      <bdi dir="ltr" className="whitespace-nowrap">
        {formattedAmount}
        {formattedMaximum !== formattedAmount && `–${formattedMaximum}`}
      </bdi>{" "}
      <span className="sf-price-currency">
        {getCurrencyLabel(currency, locale)}
      </span>
    </bdi>
  );
}
