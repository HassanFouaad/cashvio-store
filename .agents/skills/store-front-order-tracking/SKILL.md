---
name: store-front-order-tracking
description: Guest order lookup by order number and phone, timeline status progression, and online payment status polling
---

# Guest Order Tracking & Payment Polling

How to implement the public order tracking search, render status progression timelines, handle fulfillment expectations, and poll pending online payments.

## When to Use
- Implementing or modifying `/track/page.tsx` or `src/features/order-tracking/`.
- Tracking orders via `orderNumber` and `phone`.
- Handling `/payment/result` status polling after gateway redirect.
- Rendering fulfillment status timelines (`PENDING`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).

## Core Rules & Invariants
1. **Two-Factor Guest Lookup**: The public track endpoint `/public/orders/track` strictly requires BOTH `orderNumber` and `phone` to protect customer privacy.
2. **Never Trust Gateway Redirect Params**: On `/payment/result`, never trust query parameters from third-party payment gateways. Always poll `/public/orders/track` directly to verify payment status.
3. **Status Progression Order**:
   - `PENDING` -> `ACCEPTED` -> `PREPARING` -> `OUT_FOR_DELIVERY` / `READY_FOR_PICKUP` -> `COMPLETED`
   - Terminal negative states: `CANCELLED`, `FAILED`.

## Step-by-Step Implementation Flow

### Step 1: Order Lookup API Call
```typescript
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { TrackOrderRequest, TrackOrderResponse } from "../types/order-tracking.types";

export async function trackOrder(
  payload: TrackOrderRequest
): Promise<TrackOrderResponse> {
  const params = new URLSearchParams({
    orderNumber: payload.orderNumber,
    phone: payload.phone,
  });

  return apiClient.get<TrackOrderResponse>(
    `${endpoints.orders.track}?${params.toString()}`
  );
}
```

### Step 2: Payment Result Polling Logic
```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackOrder } from "@/features/order-tracking/actions/track-order";
import { getPendingPayment, clearPendingPayment } from "@/features/checkout/utils/pending-payment";

export function PaymentResultTracker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    const pending = getPendingPayment();
    if (!pending) {
      router.replace("/");
      return;
    }

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const order = await trackOrder({
          orderNumber: pending.orderNumber,
          phone: pending.phone,
        });

        if (order.paymentStatus === "PAID") {
          clearInterval(interval);
          clearPendingPayment();
          setStatus("success");
          router.replace(`/order-success?orderNumber=${order.orderNumber}`);
        } else if (attempts >= 10 || order.paymentStatus === "FAILED") {
          clearInterval(interval);
          setStatus("failed");
        }
      } catch (err) {
        if (attempts >= 10) {
          clearInterval(interval);
          setStatus("failed");
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [router]);

  if (status === "loading") {
    return <div className="text-center py-12">Verifying payment with your bank...</div>;
  }

  if (status === "failed") {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-destructive">Payment Incomplete</h2>
        <p className="text-muted-foreground">We could not confirm your payment.</p>
      </div>
    );
  }

  return null;
}
```

### Step 3: Status Progression Timeline Component
```tsx
import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";
import { OrderStatus } from "../types/order-tracking.types";

const STEPS = [
  { key: OrderStatus.PENDING, icon: Clock, label: "Order Placed" },
  { key: OrderStatus.PREPARING, icon: Package, label: "Preparing" },
  { key: OrderStatus.OUT_FOR_DELIVERY, icon: Truck, label: "On the Way" },
  { key: OrderStatus.COMPLETED, icon: CheckCircle2, label: "Delivered" },
];

export function OrderTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  if (currentStatus === OrderStatus.CANCELLED) {
    return (
      <div className="flex items-center gap-2 text-destructive font-medium p-4 bg-destructive/10 rounded-lg">
        <XCircle className="h-5 w-5" />
        <span>This order was cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="space-y-4">
      {STEPS.map((step, idx) => {
        const isDone = idx <= currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center gap-4">
            <div
              className={`p-2 rounded-full ${
                isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={`font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```typescript
// ❌ FORBIDDEN — Looking up order by orderNumber only without phone verification
const order = await apiClient.get(`/public/orders/${orderNumber}`);

// ✅ REQUIRED — Two-factor verification using track endpoint
const order = await apiClient.get(`/public/orders/track?orderNumber=${orderNumber}&phone=${phone}`);
```
