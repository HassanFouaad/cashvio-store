---
name: payment-integrations
description: CASH, ONLINE (Paymob intention, redirect, polling, retry), and RECEIPT (presigned S3 upload) payment flows
---

# Payment Method Integrations

How to handle the three primary storefront payment methods: Cash on Delivery (`CASH`), Online Card/Wallet (`ONLINE`), and Bank Transfer / Receipt Upload (`RECEIPT`).

## When to Use

- Implementing or modifying checkout payment method selection.
- Handling Paymob / online gateway redirection and return callbacks.
- Managing bank receipt upload to presigned S3 URLs.
- Retrying failed online payment sessions.

## Core Rules & Invariants

1. **Available Payment Methods Gate**: Only render payment methods returned by `/public/stores/{storeId}/payment-methods`.
2. **`CASH` Flow**: Requires no upfront transaction. Order status is immediately created as `PENDING`.
3. **`ONLINE` Flow**:
   - Order creation returns `paymentUrl`.
   - Store pending payment context in `localStorage` (`sf_pending_payment`).
   - Redirect client to gateway `paymentUrl`.
   - Gateway returns to `/payment/result` -> poll `/public/orders/track` to confirm `paymentStatus === 'PAID'`.
4. **`RECEIPT` Flow**:
   - Customer attaches bank transfer receipt image.
   - Client requests presigned S3 URL from `/public/stores/{storeId}/receipt-upload-url`.
   - Client uploads image directly via `PUT` to S3.
   - S3 `fileKey` is passed in `CreateOrderRequest.receiptKey`.

## Step-by-Step Implementation Flow

### Step 1: Payment Method Enum & Types

```typescript
export enum PaymentMethod {
  CASH = "CASH",
  ONLINE = "ONLINE",
  RECEIPT = "RECEIPT",
}

export interface StorefrontPaymentMethodsDto {
  cashOnDeliveryEnabled: boolean;
  onlinePaymentEnabled: boolean;
  receiptUploadEnabled: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    iban: string;
    accountHolderName: string;
  };
}
```

### Step 2: Payment Execution Branching

```typescript
export async function executeOrderPayment(
  order: PublicOrderDto,
  method: PaymentMethod,
  router: AppRouterInstance,
) {
  switch (method) {
    case PaymentMethod.CASH:
    case PaymentMethod.RECEIPT:
      // Navigate to order success page
      saveOrderSuccessRecap({
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        currency: order.currency,
        timestamp: Date.now(),
      });
      router.push("/order-success");
      break;

    case PaymentMethod.ONLINE:
      if (!order.paymentUrl) {
        throw new Error("Missing payment gateway URL from server");
      }
      // Save pending context before gateway redirect
      savePendingPayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        phone: order.customer.phone,
      });
      window.location.href = order.paymentUrl;
      break;
  }
}
```

### Step 3: Retrying Online Payment for Existing Order

```typescript
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";

export async function retryOnlinePayment(orderId: string): Promise<string> {
  const response = await apiClient.post<{ paymentUrl: string }>(
    endpoints.orders.paymentSession(orderId),
  );
  return response.paymentUrl;
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```typescript
// ❌ FORBIDDEN — Sending base64 raw receipt image in order create body
await apiClient.post("/public/orders", {
  ...orderData,
  receiptBase64: "data:image/jpeg;base64,...", // Bloats payload, crashes server!
});

// ✅ REQUIRED — Presigned S3 direct upload, sending S3 fileKey only
const fileKey = await uploadPaymentReceipt(storeId, receiptFile);
await apiClient.post(endpoints.orders.create, {
  ...orderData,
  receiptKey: fileKey,
});
```
