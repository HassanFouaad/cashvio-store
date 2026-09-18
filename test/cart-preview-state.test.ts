import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CartPreviewError,
  type CartPreviewRequestSnapshot,
  type CartPreviewResult,
  type ResolveCartPreviewInput,
} from "@/features/cart/types/cart-preview.types";
import { resolveCartPreviewState } from "@/features/cart/utils/cart-preview-state";
import {
  FulfillmentMethod,
  type OrderPreviewResponse,
} from "@/features/checkout/types/checkout.types";

const request: CartPreviewRequestSnapshot = {
  revision: 0,
  body: {
    storeId: "store-a",
    fulfillmentMethod: FulfillmentMethod.DELIVERY,
    items: [{ variantId: "variant-a", quantity: 1 }],
  },
};
const quote: OrderPreviewResponse = {
  storeId: "store-a",
  currency: "EGP",
  fulfillmentMethod: FulfillmentMethod.DELIVERY,
  subtotal: 120,
  totalDiscount: 0,
  catalogueDiscountTotal: 0,
  totalTax: 0,
  serviceFees: 0,
  deliveryFees: 10,
  paymentFees: 0,
  totalAmount: 130,
  items: [],
};
const result: CartPreviewResult = { request, preview: quote, error: null };
const baseline: ResolveCartPreviewInput = {
  request,
  result,
  hasItems: true,
  isInitialized: true,
  methodsError: null,
};
const pending = { preview: null, isPreviewLoading: true, previewError: null };

describe("cart quote freshness", () => {
  it("displays only a successful quote for the current request snapshot", () => {
    assert.deepEqual(resolveCartPreviewState(baseline), {
      preview: quote,
      isPreviewLoading: false,
      previewError: null,
    });
  });

  it("hides an old quote immediately when quantities change, before debounce runs", () => {
    const changed = {
      ...request,
      body: {
        ...request.body,
        items: [{ variantId: "variant-a", quantity: 2 }],
      },
    };
    assert.deepEqual(
      resolveCartPreviewState({ ...baseline, request: changed }),
      pending,
    );
  });

  it("does not display an old fulfillment-method quote", () => {
    const changed = {
      ...request,
      body: { ...request.body, fulfillmentMethod: FulfillmentMethod.PICKUP },
    };
    assert.deepEqual(
      resolveCartPreviewState({ ...baseline, request: changed }),
      pending,
    );
  });

  it("does not display another store's last quote", () => {
    const changed = {
      ...request,
      body: { ...request.body, storeId: "store-b" },
    };
    assert.deepEqual(
      resolveCartPreviewState({ ...baseline, request: changed }),
      pending,
    );
  });

  it("requires a fresh quote after cart synchronization even for identical values", () => {
    assert.deepEqual(
      resolveCartPreviewState({ ...baseline, request: { ...request } }),
      pending,
    );
    assert.deepEqual(
      resolveCartPreviewState({ ...baseline, request: null }),
      pending,
    );
  });

  it("clears errors as soon as a deliberate retry starts", () => {
    const failure = {
      request,
      preview: null,
      error: CartPreviewError.LOAD_FAILED,
    };
    assert.deepEqual(
      resolveCartPreviewState({
        ...baseline,
        result: failure,
        request: { ...request, revision: 1 },
      }),
      pending,
    );
  });

  it("an empty cart cannot be repopulated by a late response", () => {
    assert.deepEqual(
      resolveCartPreviewState({ ...baseline, hasItems: false }),
      { preview: null, isPreviewLoading: false, previewError: null },
    );
  });

  it("does not display totals before cart initialization", () => {
    assert.deepEqual(
      resolveCartPreviewState({ ...baseline, isInitialized: false }),
      { preview: null, isPreviewLoading: false, previewError: null },
    );
  });

  for (const error of Object.values(CartPreviewError)) {
    it(`makes fulfillment recovery available for ${error}`, () => {
      assert.deepEqual(
        resolveCartPreviewState({ ...baseline, methodsError: error }),
        { preview: null, isPreviewLoading: false, previewError: error },
      );
    });
  }

  it("returns a recoverable error instead of a zero quote or endless loading", () => {
    assert.deepEqual(
      resolveCartPreviewState({
        ...baseline,
        result: { request, preview: null, error: null },
      }),
      {
        preview: null,
        isPreviewLoading: false,
        previewError: CartPreviewError.LOAD_FAILED,
      },
    );
  });

  it("does not present cached totals as current after a failure", () => {
    assert.deepEqual(
      resolveCartPreviewState({
        ...baseline,
        result: {
          request,
          preview: quote,
          error: CartPreviewError.LOAD_FAILED,
        },
      }),
      {
        preview: null,
        isPreviewLoading: false,
        previewError: CartPreviewError.LOAD_FAILED,
      },
    );
  });

  it("a legitimate zero-priced quote is not treated as a failed request", () => {
    const free = { ...quote, totalAmount: 0, subtotal: 0, deliveryFees: 0 };
    assert.equal(
      resolveCartPreviewState({
        ...baseline,
        result: { request, preview: free, error: null },
      }).preview?.totalAmount,
      0,
    );
  });
});
