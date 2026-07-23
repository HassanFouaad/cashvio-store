"use client";

import { Check, Facebook, Link2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ProductShareButtonsProps {
  productName: string;
  productUrl: string;
}

const COPIED_RESET_MS = 2000;

const shareButtonClasses =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors";

/**
 * Product share row — WhatsApp and Facebook deep links plus copy-link.
 * WhatsApp is the primary sharing channel for the target market, so it
 * comes first.
 */
export function ProductShareButtons({
  productName,
  productUrl,
}: ProductShareButtonsProps) {
  const t = useTranslations("store.products.share");
  const [copied, setCopied] = useState(false);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${productName}: ${productUrl}`,
  )}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    productUrl,
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Clipboard unavailable — the URL is still in the address bar
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground me-1">{t("label")}</span>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsapp")}
        className={shareButtonClasses}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("facebook")}
        className={shareButtonClasses}
      >
        <Facebook className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t("copyLink")}
        className={shareButtonClasses}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
      {copied && (
        <span className="text-xs text-muted-foreground">{t("copied")}</span>
      )}
    </div>
  );
}
