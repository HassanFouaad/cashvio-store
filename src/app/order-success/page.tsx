"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const REDIRECT_SECONDS = 30;
const TOKEN_KEY = "order-success-token";
/** Max token age (5 minutes) – prevents stale tokens from granting access. */
const TOKEN_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Thank-you / order-success page.
 *
 * Protected by a short-lived sessionStorage token that the checkout form sets
 * immediately before redirecting here. If the token is missing, expired, or
 * already consumed the user is sent back to the home page.
 *
 * Features:
 * - Animated success icon
 * - Order number display
 * - 30-second auto-redirect countdown to home page
 * - Fully localized (en / ar)
 */
export default function OrderSuccessPage() {
  const t = useTranslations("orderSuccess");
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get("orderNumber") ?? "";
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [authorized, setAuthorized] = useState(false);
  const guardChecked = useRef(false);

  // ---------- Access guard ----------
  useEffect(() => {
    if (guardChecked.current) return;
    guardChecked.current = true;

    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) {
        router.replace("/");
        return;
      }

      const tokenTime = parseInt(token, 10);
      if (
        Number.isNaN(tokenTime) ||
        Date.now() - tokenTime > TOKEN_MAX_AGE_MS
      ) {
        sessionStorage.removeItem(TOKEN_KEY);
        router.replace("/");
        return;
      }

      // Token valid — consume it so a page refresh won't re-enter
      sessionStorage.removeItem(TOKEN_KEY);
      setAuthorized(true);
    } catch {
      // sessionStorage unavailable — allow access if orderNumber exists
      if (orderNumber) {
        setAuthorized(true);
      } else {
        router.replace("/");
      }
    }
  }, [router, orderNumber]);

  // ---------- Countdown ----------
  const redirectToHome = useCallback(() => {
    router.push("/");
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    if (secondsLeft <= 0) {
      redirectToHome();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [authorized, secondsLeft, redirectToHome]);

  // Don't render anything until the guard check has completed
  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Animated check icon */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Outer pulse ring */}
            <span className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Heading & sub-text */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            {t("message")}
          </p>
        </div>

        {/* Order number card */}
        {orderNumber && (
          <div className="mx-auto max-w-xs p-5 bg-muted/50 rounded-2xl border border-border space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              {t("orderNumber")}
            </p>
            <p className="text-xl sm:text-2xl font-bold font-mono break-all">
              {orderNumber}
            </p>
          </div>
        )}

        {/* Countdown + CTA */}
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {t("redirecting", { seconds: secondsLeft })}
          </p>

          <Link href="/" className="inline-block w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 px-8"
              onClick={redirectToHome}
            >
              <Home className="h-4 w-4" />
              {t("backToHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
