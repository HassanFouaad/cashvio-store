"use client";

import { InstapayIcon, WalletIcon } from "@/components/icons";
import type { PublicReceiptPaymentConfigDto } from "@/features/checkout/types/checkout.types";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ReceiptTransferDetailsProps {
  config?: PublicReceiptPaymentConfigDto;
}

export function ReceiptTransferDetails({
  config,
}: ReceiptTransferDetailsProps) {
  const t = useTranslations("checkout");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!config) return null;

  const walletNumber = config.walletNumber?.trim();
  const instapayId = config.instapayId?.trim();

  if (!walletNumber && !instapayId) return null;

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      // Fallback for browsers that block clipboard API
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {t("transferDetails.title")}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("transferDetails.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {walletNumber && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border/70 bg-card/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-md bg-muted/60 flex items-center justify-center shrink-0 text-foreground">
                <WalletIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transferDetails.wallet")}
                </span>
                <span
                  dir="ltr"
                  className="block text-sm font-semibold text-foreground truncate font-mono select-all"
                >
                  {walletNumber}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(walletNumber, "wallet")}
              className="inline-flex items-center gap-1 shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
              aria-label={`${t("transferDetails.copy")} ${t("transferDetails.wallet")}`}
            >
              {copiedKey === "wallet" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success font-medium">
                    {t("transferDetails.copied")}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("transferDetails.copy")}</span>
                </>
              )}
            </button>
          </div>
        )}

        {instapayId && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border/70 bg-card/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-md bg-[#5F259F]/10 flex items-center justify-center shrink-0">
                <InstapayIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {t("transferDetails.instapay")}
                </span>
                <span
                  dir="ltr"
                  className="block text-sm font-semibold text-foreground truncate font-mono select-all"
                >
                  {instapayId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(instapayId, "instapay")}
              className="inline-flex items-center gap-1 shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
              aria-label={`${t("transferDetails.copy")} ${t("transferDetails.instapay")}`}
            >
              {copiedKey === "instapay" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success font-medium">
                    {t("transferDetails.copied")}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{t("transferDetails.copy")}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
