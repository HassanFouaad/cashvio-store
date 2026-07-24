"use client";

import { Button } from "@/components/ui/button";
import { createPaymentSession } from "@/features/checkout/api/checkout-api";
import {
  clearPendingPayment,
  getPendingPayment,
  type PendingPaymentContext,
} from "@/features/checkout/utils/pending-payment";
import { trackOrder } from "@/features/order-tracking/api/track-order";
import { PaymentStatus } from "@/features/order-tracking/types/order-tracking.types";
import { getApiStoreId } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  AlertCircle,
  CreditCard,
  Home,
  Loader2,
  PackageSearch,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

/** How often the track endpoint is polled while confirming */
const POLL_INTERVAL_MS = 3000;

/** Give webhooks + fallback inquiry time before offering a retry */
const POLL_TIMEOUT_MS = 90_000;

type ResultView = "checking" | "unconfirmed" | "missing-context";

/**
 * Gateway redirect landing page. Query params from the gateway are NEVER
 * trusted — the order's real payment status is polled from the public
 * track endpoint (which the backend only flips after multi-source
 * confirmation with the provider).
 */
function PaymentResultContent() {
  const t = useTranslations("paymentResult");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderIdParam = searchParams.get("orderId");
  const [context, setContext] = useState<PendingPaymentContext | null>(null);
  const [view, setView] = useState<ResultView>("checking");
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  // Seeded when polling starts (useRef initializers must stay pure)
  const startedAtRef = useRef<number>(0);
  const stoppedRef = useRef(false);

  // Resolve the pending-payment context saved before the redirect
  useEffect(() => {
    let isCancelled = false;

    const resolveContext = async () => {
      const pending = getPendingPayment();
      if (isCancelled) return;

      if (!pending || (orderIdParam && pending.orderId !== orderIdParam)) {
        setView("missing-context");
        return;
      }

      setContext(pending);
    };

    void resolveContext();

    return () => {
      isCancelled = true;
    };
  }, [orderIdParam]);

  const goToSuccess = useCallback(
    (orderNumber: string) => {
      stoppedRef.current = true;
      clearPendingPayment();
      try {
        sessionStorage.setItem("order-success-token", Date.now().toString());
      } catch {
        // sessionStorage may be unavailable in some browsers
      }
      router.replace(
        `/order-success?orderNumber=${encodeURIComponent(orderNumber)}`,
      );
    },
    [router],
  );

  // Poll the track endpoint until PAID or timeout
  useEffect(() => {
    if (!context) return;
    stoppedRef.current = false;
    startedAtRef.current = Date.now();

    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (stoppedRef.current) return;

      try {
        const order = await trackOrder({
          orderNumber: context.orderNumber,
          phone: context.phone,
        });

        if (order.paymentStatus === PaymentStatus.PAID) {
          goToSuccess(context.orderNumber);
          return;
        }
      } catch {
        // Transient tracking errors — keep polling until the timeout
      }

      if (Date.now() - startedAtRef.current >= POLL_TIMEOUT_MS) {
        setView("unconfirmed");
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    void poll();

    return () => {
      stoppedRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [context, goToSuccess]);

  const handleRetryPayment = useCallback(async () => {
    if (!context || isRetrying) return;
    const storeId = getApiStoreId();
    if (!storeId) {
      setRetryError(t("retryError"));
      return;
    }

    setIsRetrying(true);
    setRetryError(null);

    try {
      const session = await createPaymentSession({
        storeId,
        orderId: context.orderId,
      });
      window.location.assign(session.checkoutUrl);
    } catch {
      setRetryError(t("retryError"));
      setIsRetrying(false);
    }
  }, [context, isRetrying, t]);

  // No saved context — cannot poll; guide the customer to tracking
  if (view === "missing-context") {
    return (
      <div className="sf-order-shell min-h-[60vh] flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <PackageSearch className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("missingContextTitle")}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t("missingContextMessage")}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/track" className="w-full">
              <Button className="w-full gap-2">
                <PackageSearch className="h-4 w-4" />
                {t("trackOrder")}
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                {t("backToHome")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment not confirmed within the polling window — offer a retry
  if (view === "unconfirmed" && context) {
    return (
      <div className="sf-order-shell min-h-[60vh] flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("unconfirmedTitle")}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t("unconfirmedMessage")}
          </p>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("orderNumber")}</span>
              <span className="font-medium">{context.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("amount")}</span>
              <span className="font-semibold">
                {formatCurrency(context.totalAmount, context.currency, locale)}
              </span>
            </div>
          </div>

          {retryError && (
            <p className="text-sm text-destructive">{retryError}</p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetryPayment}
              disabled={isRetrying}
              className="w-full gap-2"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {t("retryPayment")}
            </Button>
            <Link
              href={`/track?orderNumber=${encodeURIComponent(context.orderNumber)}`}
              className="w-full"
            >
              <Button variant="outline" className="w-full gap-2">
                <PackageSearch className="h-4 w-4" />
                {t("trackOrder")}
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full gap-2">
                <Home className="h-4 w-4" />
                {t("backToHome")}
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("unconfirmedNote")}
          </p>
        </div>
      </div>
    );
  }

  // Confirming — polling the real payment status
  return (
    <div className="sf-order-shell min-h-[60vh] flex items-center justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("checkingTitle")}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {t("checkingMessage")}
        </p>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultContent />
    </Suspense>
  );
}
