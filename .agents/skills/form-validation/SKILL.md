---
name: form-validation
description: Checkout form validation, international phone validation, error state rendering, and field-level error messages
---

# Form Validation & Error State Rendering

How to validate user inputs across checkout, order search, and review submission forms, handle international phone numbers, and render localized error states.

## When to Use

- Validating the checkout form fields (name, phone, delivery address, table number, fulfillment fields).
- Validating the order lookup form (`orderNumber`, `phone`).
- Handling inline validation errors and focus management.

## Core Rules & Invariants

1. **Name Validation**: Customer name must be at least 2 characters and contain no invalid control characters.
2. **Phone Number Standardization**: Use `react-international-phone` utilities to ensure numbers conform to valid national/international lengths before submission.
3. **Fulfillment-Specific Field Validation**:
   - `DELIVERY`: Requires `deliveryZoneId` and `addressDetails` (min 5 characters).
   - `PICKUP`: Requires `pickupBranchId` if multiple branches exist.
   - `DINE_IN`: Requires `tableNumber` (min 1 character).
4. **Translated Error Messages**: All validation error strings must be pulled from the `checkout.validation.*` or `common.validation.*` i18n keys.

## Step-by-Step Implementation Flow

### Step 1: Form Validation Function Pattern

```typescript
import { CheckoutFormState, FulfillmentMethod } from "../types/checkout.types";

export interface FormErrors {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryZoneId?: string;
  addressDetails?: string;
  tableNumber?: string;
  receiptKey?: string;
}

export function validateCheckoutForm(
  values: CheckoutFormState,
  t: (key: string) => string,
): { isValid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};

  if (!values.customerName || values.customerName.trim().length < 2) {
    errors.customerName = t("validation.nameRequired");
  }

  if (
    !values.customerPhone ||
    values.customerPhone.replace(/\D/g, "").length < 8
  ) {
    errors.customerPhone = t("validation.phoneInvalid");
  }

  if (values.fulfillmentMethod === FulfillmentMethod.DELIVERY) {
    if (!values.deliveryZoneId) {
      errors.deliveryZoneId = t("validation.zoneRequired");
    }
    if (!values.addressDetails || values.addressDetails.trim().length < 5) {
      errors.addressDetails = t("validation.addressRequired");
    }
  }

  if (values.fulfillmentMethod === FulfillmentMethod.DINE_IN) {
    if (!values.tableNumber || values.tableNumber.trim().length === 0) {
      errors.tableNumber = t("validation.tableRequired");
    }
  }

  if (values.paymentMethod === "RECEIPT" && !values.receiptKey) {
    errors.receiptKey = t("validation.receiptRequired");
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

### Step 2: Rendering Field-Level Errors in JSX

```tsx
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export function FormField({
  label,
  error,
  ...inputProps
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        {...inputProps}
        className={
          error ? "border-destructive focus-visible:ring-destructive" : ""
        }
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive mt-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
```

## ❌ FORBIDDEN / ✅ REQUIRED Examples

```tsx
// ❌ FORBIDDEN — Hardcoded error string without translation
{
  errors.phone && (
    <span className="text-red-500">Please enter a valid phone number</span>
  );
}

// ✅ REQUIRED — Translated error message with semantic text color
{
  errors.customerPhone && (
    <span className="text-destructive text-xs">{errors.customerPhone}</span>
  );
}
```
