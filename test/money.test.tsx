import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { NextIntlClientProvider } from "next-intl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Money } from "@/components/ui/money";
import { AddToCartSection } from "@/features/products/components/add-to-cart-section";
import { PriceDisplay } from "@/features/products/components/price-display";
import {
  ProductStatus,
  type PublicProductDto,
  type PublicProductVariantDto,
} from "@/features/products/types/product.types";
import { formatCurrency } from "@/lib/utils/formatters";

import arabicMessages from "../messages/ar.json" with { type: "json" };

const variant: PublicProductVariantDto = {
  id: "variant-1",
  sku: "SKU-1",
  name: "Standard",
  sellingPrice: 110,
  availableQuantity: 10,
  inStock: true,
  inventoryTrackable: true,
};

const product: PublicProductDto = {
  id: "product-1",
  name: "Fixture",
  status: ProductStatus.ACTIVE,
  taxIncluded: true,
  taxRate: 0,
  inventoryTrackable: true,
  availableOnStoreFront: true,
  variants: [variant],
};

describe("storefront money", () => {
  it("uses the same digits and localized currency labels in both languages", () => {
    assert.equal(formatCurrency(110, "EGP", "ar"), "110\u00a0جنيه مصري");
    assert.equal(formatCurrency(110, "egp", "en"), "110\u00a0EGP");
    assert.equal(formatCurrency(0, "EGP", "en"), "0\u00a0EGP");
  });

  it("keeps currency precision for fractional amounts and groups large values", () => {
    assert.equal(formatCurrency(1234.5, "EGP", "en"), "1,234.50\u00a0EGP");
    assert.equal(formatCurrency(1.125, "KWD", "en"), "1.125\u00a0KWD");
    assert.equal(formatCurrency(1234, "JPY", "en"), "1,234\u00a0JPY");
  });

  it("isolates signed prices in Arabic", () => {
    const markup = renderToStaticMarkup(
      createElement(Money, { amount: -12.5, currency: "EGP", locale: "ar" }),
    );
    assert.match(markup, /dir="rtl" lang="ar".*dir="ltr"[^>]*>-12\.50<\/bdi>/);
    assert.equal(
      formatCurrency(30, "EGP", "ar", true),
      "\u2066+30\u2069\u00a0جنيه مصري",
    );
  });

  it("shows a catalogue variant range with a single currency label", () => {
    const markup = renderToStaticMarkup(
      createElement(PriceDisplay, {
        product: {
          ...product,
          variants: [
            variant,
            { ...variant, id: "variant-2", sellingPrice: 135.5 },
          ],
        },
        currency: "EGP",
        locale: "en",
      }),
    );
    assert.match(markup, /110–135\.50/);
    assert.equal(markup.match(/EGP/g)?.length, 1);
  });

  it("renders no extra zero by the product price and keeps the positive tax notice", () => {
    const router = {
      bfcacheId: "fixture",
      back() {},
      forward() {},
      prefetch() {},
      push() {},
      refresh() {},
      replace() {},
    };
    const renderProduct = (taxRate: number): string =>
      renderToStaticMarkup(
        <AppRouterContext.Provider value={router}>
          <NextIntlClientProvider locale="ar" messages={arabicMessages} timeZone="UTC">
            <AddToCartSection
              product={{ ...product, taxRate }}
              variants={[variant]}
              currency="EGP"
              locale="ar"
              storeId="fixture"
            />
          </NextIntlClientProvider>
        </AppRouterContext.Provider>,
      );

    const zeroTaxMarkup = renderProduct(0);
    assert.match(
      zeroTaxMarkup,
      />110<\/bdi> .*جنيه مصري<\/span><\/bdi><\/div>/,
    );
    assert.doesNotMatch(zeroTaxMarkup, /شامل الضريبة/);
    assert.match(renderProduct(14), /شامل الضريبة/);
  });
});
