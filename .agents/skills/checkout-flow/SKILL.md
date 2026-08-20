---
name: checkout-flow
description: Guest checkout, fulfillment methods (DELIVERY, PICKUP, DINE_IN), address validation, order preview, coupon validation, receipt uploads, and session-gated order recap
---

# Guest Checkout & Order Lifecycle

How to implement and maintain the guest checkout flow, handle fulfillment options, validate addresses, calculate order previews, process receipt uploads to presigned S3 URLs, and secure post-checkout recap access.

## When to Use
- Modifying `src/features/checkout/components/checkout-form.tsx` or related checkout steps.
- Adding fulfillment methods (`DELIVERY`, `PICKUP`, `DINE_IN`).
- Handling coupon application and real-time order preview pricing.
- Implementing payment workflows (Cash on Delivery, Online Payment, Bank Transfer / Receipt).
- Securing the `/order-success` confirmation page.

## Core Rules & Invariants
1. **Zero User Login Required**: Checkout is strictly guest-based. Customer details (`name`, `phone`, `email`) are captured per order.
2. **Order Preview Before Creation**: Always invoke `/public/orders/preview` on cart or fulfillment changes to display accurate subtotal, delivery fee, taxes, discounts, and total.
3. **Receipt Payment (`RECEIPT`) Flow**:
   - Request presigned S3 upload URL from `/public/stores/{storeId}/receipt-upload-url`.
   - Upload file directly to S3 via `PUT`.
   - Pass the returned `receiptKey` into `createOrder` payload.
4. **Session-Gated Order Success**: The `/order-success` page checks `sessionStorage` for a valid order recap token (`sf_order_recap`). Direct navigation without a token redirects to home.
5. **Phone Validation**: Validate phone numbers using `react-international-phone` utilities with E.164 standardization.

## Step-by-Step Implementation Flow

### Step 1: Fulfillment Selection and Address State
```typescript
export enum FulfillmentMethod {
  DELIVERY = "DELIVERY",
  PICKUP = "PICKUP",
  DINE_IN = "DINE_IN",
}

export interface CheckoutFormState {
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryZoneId?: string;
  addressDetails?: string;
  tableNumber?: string;
  pickupBranchId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
  receiptKey?: string;
}
```

### Step 2: Real-Time Order Preview Calculation
```typescript
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/config";
import { OrderPreviewRequest, OrderPreviewResponse } from "../types/checkout.types";

export async function fetchOrderPreview(
  payload: OrderPreviewRequest
): Promise<OrderPreviewResponse> {
  return apiClient.post<OrderPreviewResponse, OrderPreviewRequest>(
    endpoints.orders.preview,
    payload
  );
}
```

### Step 3: Presigned S3 Receipt Upload Flow
```typescript
export async function uploadPaymentReceipt(
  storeId: string,
  file: File
): Promise<string> {
  // 1. Get presigned upload URL
  const { uploadUrl, fileKey } = await apiClient.post<{ uploadUrl: string; fileKey: string }>(
    endpoints.stores.getReceiptUploadUrl(storeId),
    { fileName: file.name, contentType: file.type }
  );

  // 2. Upload directly to S3
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload receipt image");
  }

  // 3. Return S3 file key
  return fileKey;
}
```

### Step 4: Order Creation & Success Hand-off
```typescript
import { saveOrderSuccessRecap } from "@/features/checkout/utils/order-success-recap";

export async function handleOrderSubmit(formState: CheckoutFormState, cart: CartState) {
  const createPayload: CreateOrderRequest = {
    fulfillmentMethod: formState.fulfillmentMethod,
    customer: {
      name: formState.customerName,
      phone: formState.customerPhone,
      email: formState.customerEmail,
    },
    items: cart.items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
      modifierOptionIds: item.selectedModifiers.map(m => m.id),
    })),
    deliveryZoneId: formState.deliveryZoneId,
    address: formState.addressDetails,
    paymentMethod: formState.paymentMethod,
    receiptKey: formState.receiptKey,
    couponCode: formState.couponCode,
    notes: formState.notes,
  };

  const order = await apiClient.post<PublicOrderDto, CreateOrderRequest>(
    endpoints.orders.create,
    createPayload
  );

  // Clear cart
  cart.clearCart();

  if (formState.paymentMethod === PaymentMethod.ONLINE && order.paymentUrl) {
    // Save pending payment state and redirect to gateway
    savePendingPayment({ orderId: order.id, orderNumber: order.orderNumber });
    window.location.href = order.paymentUrl;
  } else {
    // Save order recap token to sessionStorage and navigate
    saveOrderSuccessRecap({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency,
      timestamp: Date.now(),
    });
    router.push("/order-success");
  }
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```typescript
// ❌ FORBIDDEN — Trusting client math without server preview
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0) + 30; // Hardcoded delivery fee!

// ✅ REQUIRED — Calling order preview endpoint for authoritative server calculation
const preview = await fetchOrderPreview({
  items: cart.items,
  fulfillmentMethod: FulfillmentMethod.DELIVERY,
  deliveryZoneId: selectedZoneId,
  couponCode: appliedCoupon,
});
const total = preview.total;
```
