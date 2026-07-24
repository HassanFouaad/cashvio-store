/**
 * Pending gateway-payment context persistence.
 *
 * The gateway redirect only carries the order id, but the public track
 * endpoint (which the payment-result page polls) requires the order
 * number AND the checkout phone (anti-enumeration). Checkout stores this
 * context in localStorage just before redirecting to the gateway so the
 * result page can poll and offer "Retry payment" — localStorage (not
 * sessionStorage) because some in-app browsers restart the tab session
 * on the way back from the payment page.
 */

const PENDING_PAYMENT_KEY = "sf-pending-payment";

/** Context is useless after the payment session has long expired */
const PENDING_PAYMENT_TTL_MS = 2 * 60 * 60 * 1000;

export interface PendingPaymentContext {
  orderId: string;
  orderNumber: string;
  /** Checkout phone — required by the public track endpoint */
  phone: string;
  totalAmount: number;
  currency: string;
  savedAt: number;
}

export function savePendingPayment(
  context: Omit<PendingPaymentContext, "savedAt">,
): void {
  try {
    localStorage.setItem(
      PENDING_PAYMENT_KEY,
      JSON.stringify({ ...context, savedAt: Date.now() }),
    );
  } catch {
    // Storage unavailable — the result page degrades to the track link
  }
}

export function getPendingPayment(): PendingPaymentContext | null {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;

    const context = JSON.parse(raw) as PendingPaymentContext;
    if (Date.now() - context.savedAt > PENDING_PAYMENT_TTL_MS) {
      localStorage.removeItem(PENDING_PAYMENT_KEY);
      return null;
    }

    return context;
  } catch {
    return null;
  }
}

export function clearPendingPayment(): void {
  try {
    localStorage.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    // Storage unavailable — nothing to clear
  }
}
