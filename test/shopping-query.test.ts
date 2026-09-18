import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProductSortBy } from "@/features/products/types/product.types";
import {
  clearProductFilters,
  hasProductSearchFilters,
  parseProductSort,
} from "@/features/products/utils/catalog-filters";
import { buildPaginationUrl } from "@/lib/utils/pagination";
import {
  normalizeSearchParams,
  updateQueryUrl,
} from "@/lib/utils/query-params";

const parse = (href: string): URL => new URL(href, "https://fixture.example");
const context =
  "lang=ar&preview_draft=1&preview_font=DEFAULT&preview_custom=abcdef&coupon=SAVE10&utm_source=shop";

describe("shopping URL state", () => {
  it("keeps locale, theme preview, coupon and campaign context when searching", () => {
    const url = parse(
      updateQueryUrl("/products", `${context}&page=4&inStock=true`, {
        search: "قهوة & tea",
      }),
    );
    assert.equal(url.searchParams.get("search"), "قهوة & tea");
    assert.equal(url.searchParams.get("inStock"), "true");
    assert.equal(url.searchParams.has("page"), false);
    for (const [key, value] of new URLSearchParams(context))
      assert.equal(url.searchParams.get(key), value);
  });

  it("clears one filter without dropping the others", () => {
    const url = parse(
      updateQueryUrl(
        "/products",
        "search=tea&categoryId=books&inStock=true&sortBy=name&page=2",
        { search: null },
      ),
    );
    assert.equal(url.searchParams.has("search"), false);
    assert.equal(url.searchParams.get("categoryId"), "books");
    assert.equal(url.searchParams.get("inStock"), "true");
    assert.equal(url.searchParams.get("sortBy"), "name");
    assert.equal(url.searchParams.has("page"), false);
  });

  it("clear-all removes only product refinements and pagination", () => {
    const url = parse(
      clearProductFilters(
        "/products",
        `${context}&search=tea&categoryId=books&sortBy=name&inStock=true&page=8`,
      ),
    );
    assert.equal(url.searchParams.toString(), context);
  });

  it("first-page recovery preserves filters instead of starting another search", () => {
    const url = parse(
      updateQueryUrl(
        "/categories/books",
        `${context}&search=tea&sortBy=name&page=8`,
        { page: null },
      ),
    );
    assert.equal(url.pathname, "/categories/books");
    assert.equal(url.searchParams.get("search"), "tea");
    assert.equal(url.searchParams.get("sortBy"), "name");
    assert.equal(url.searchParams.has("page"), false);
  });

  it("does not leave a trailing question mark when clearing the last parameter", () => {
    assert.equal(
      updateQueryUrl("/products", "search=tea&page=2", { search: "" }),
      "/products",
    );
  });

  it("can update metadata without resetting pagination when explicitly requested", () => {
    assert.equal(
      parse(
        updateQueryUrl("/products", "page=3", { lang: "ar" }, false),
      ).searchParams.get("page"),
      "3",
    );
  });

  it("normalizes repeated Next search params using the first value", () => {
    assert.deepEqual(
      normalizeSearchParams({
        search: ["tea", "coffee"],
        page: [],
        lang: "ar",
      }),
      { search: "tea", page: undefined, lang: "ar" },
    );
  });

  for (const sort of Object.values(ProductSortBy)) {
    it(`accepts supported sort ${sort}`, () =>
      assert.equal(parseProductSort(sort), sort));
  }
  it("falls back to the default sort for malformed links", () => {
    for (const input of [undefined, null, "", "unsupported", "<script>"])
      assert.equal(parseProductSort(input), ProductSortBy.CREATED_AT);
  });

  it("distinguishes search-empty results from an empty catalog", () => {
    assert.equal(hasProductSearchFilters("search=tea"), true);
    assert.equal(hasProductSearchFilters("categoryId=books"), true);
    assert.equal(hasProductSearchFilters("inStock=true"), true);
    assert.equal(hasProductSearchFilters("sortBy=name&lang=ar"), false);
    assert.equal(hasProductSearchFilters("search=+++&inStock=false"), false);
  });

  it("an old page parameter cannot override the selected destination", () => {
    const other = { page: "99", search: "tea", lang: "ar", preview_draft: "1" };
    assert.equal(
      parse(buildPaginationUrl("/products", 2, other)).searchParams.get("page"),
      "2",
    );
    const first = parse(buildPaginationUrl("/products", 1, other));
    assert.equal(first.searchParams.has("page"), false);
    assert.equal(first.searchParams.get("search"), "tea");
    assert.equal(first.searchParams.get("preview_draft"), "1");
  });

  it("normalizes first-page and non-finite destinations", () => {
    for (const value of [undefined, 0, 1, 1.8, NaN, Infinity])
      assert.equal(buildPaginationUrl("/products", value), "/products");
    assert.equal(buildPaginationUrl("/products", 2.8), "/products?page=2");
  });
});
