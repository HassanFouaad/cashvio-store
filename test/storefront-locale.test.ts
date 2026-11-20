import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NextRequest, type NextResponse } from "next/server";

import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_OVERRIDE_HEADER,
  THEME_PREVIEW_HEADER,
} from "@/lib/constants";
import { applyLocaleChange } from "@/lib/utils/locale.utils";
import { proxy } from "@/proxy";
import { CookieName, Locale } from "@/types/enums";

function makeRequest(
  query = "",
  cookie = "",
  language = "en-US,en;q=0.9",
): NextRequest {
  return new NextRequest(`https://shop.cashvio.test/products${query}`, {
    headers: { host: "shop.cashvio.test", cookie, "accept-language": language },
  });
}

function resolvedLocale(response: NextResponse): string | null {
  return response.headers.get(`x-middleware-request-${LOCALE_OVERRIDE_HEADER}`);
}

describe("storefront locale isolation", () => {
  it("has a dedicated cookie name", () => {
    assert.equal(CookieName.LOCALE, "sf_locale");
  });

  it("ignores global and legacy locales on the first visit", () => {
    const response = proxy(makeRequest("", "cv_language=ar; NEXT_LOCALE=ar"));
    assert.equal(resolvedLocale(response), Locale.ENGLISH);
    assert.equal(response.cookies.get("sf_locale")?.value, Locale.ENGLISH);
    assert.equal(response.cookies.has("NEXT_LOCALE"), false);
    assert.equal(response.cookies.has("cv_language"), false);
  });

  for (const locale of [Locale.ENGLISH, Locale.ARABIC]) {
    it(`keeps the ${locale} storefront cookie ahead of global/browser preferences`, () => {
      const other = locale === Locale.ENGLISH ? Locale.ARABIC : Locale.ENGLISH;
      const response = proxy(
        makeRequest(
          "",
          `sf_locale=${locale}; NEXT_LOCALE=${other}; cv_language=${other}; sf_visitor_id=visitor`,
          other,
        ),
      );
      assert.equal(resolvedLocale(response), locale);
      assert.equal(response.cookies.has("sf_locale"), false);
    });

    it(`persists and forwards an explicit ${locale} query override`, () => {
      const other = locale === Locale.ENGLISH ? Locale.ARABIC : Locale.ENGLISH;
      const response = proxy(
        makeRequest(
          `?lang=${locale}`,
          `sf_locale=${other}; NEXT_LOCALE=${other}; cv_language=${other}`,
        ),
      );
      assert.equal(resolvedLocale(response), locale);
      const cookie = response.cookies.get("sf_locale");
      assert.equal(cookie?.value, locale);
      assert.equal(cookie?.domain, undefined);
      assert.equal(cookie?.path, "/");
      assert.equal(cookie?.sameSite, "lax");
      assert.equal(cookie?.maxAge, LOCALE_COOKIE_MAX_AGE_SECONDS);
      assert.equal(response.cookies.has("NEXT_LOCALE"), false);
      assert.equal(response.cookies.has("cv_language"), false);
    });
  }

  it("ignores invalid lang without discarding a saved storefront preference", () => {
    assert.equal(
      resolvedLocale(proxy(makeRequest("?lang=fr", "sf_locale=en", "ar"))),
      Locale.ENGLISH,
    );
  });

  it("replaces an invalid cookie using browser language in the current render", () => {
    const response = proxy(
      makeRequest(
        "?lang=fr",
        "sf_locale=invalid; NEXT_LOCALE=en",
        "ar-EG,ar;q=0.9,en;q=0.8",
      ),
    );
    assert.equal(resolvedLocale(response), Locale.ARABIC);
    assert.equal(response.cookies.get("sf_locale")?.value, Locale.ARABIC);
  });

  it("renders the preferred supported browser language on the first request", () => {
    assert.equal(
      resolvedLocale(
        proxy(makeRequest("", "", "fr-FR;q=1,ar-EG;q=0.8,en;q=0.9")),
      ),
      Locale.ENGLISH,
    );
  });

  it("defaults to Arabic when no supported browser language exists", () => {
    const response = proxy(
      makeRequest("", "NEXT_LOCALE=en; cv_language=en", "fr-FR"),
    );
    assert.equal(resolvedLocale(response), Locale.ARABIC);
    assert.equal(response.cookies.get("sf_locale")?.value, Locale.ARABIC);
  });

  it("overwrites a supplied internal locale header with the resolved storefront language", () => {
    const request = makeRequest("", "sf_locale=en; sf_visitor_id=visitor");
    request.headers.set(LOCALE_OVERRIDE_HEADER, "ar");
    assert.equal(resolvedLocale(proxy(request)), Locale.ENGLISH);
  });

  it("still forwards theme preview alongside the resolved saved locale", () => {
    const response = proxy(
      makeRequest(
        "?preview_draft=1",
        "sf_locale=en; sf_visitor_id=visitor",
        "ar",
      ),
    );
    assert.equal(resolvedLocale(response), Locale.ENGLISH);
    assert.ok(
      response.headers.get(`x-middleware-request-${THEME_PREVIEW_HEADER}`),
    );
  });
});

describe("shared desktop/mobile language change", () => {
  for (const locale of [Locale.ENGLISH, Locale.ARABIC]) {
    for (const suffix of [
      "?lang=ar&lang=en&search=tea&preview_draft=1&utm_source=shop#details",
      "?search=tea&preview_draft=1&utm_source=shop#details",
      "?search=tea&preview_draft=1&utm_source=shop",
    ]) {
      it(`switches to ${locale} and reloads the page with URL state ${suffix}`, () => {
        const previousDocument = Object.getOwnPropertyDescriptor(
          globalThis,
          "document",
        );
        const previousWindow = Object.getOwnPropertyDescriptor(
          globalThis,
          "window",
        );
        const writes: string[] = [];
        const navigations: string[] = [];
        let reloadCount = 0;
        const href = `https://shop.cashvio.test/products${suffix}`;
        const expectedUrl = new URL(href);
        expectedUrl.searchParams.delete("lang");
        Object.defineProperty(globalThis, "document", {
          configurable: true,
          value: {
            set cookie(value: string) {
              writes.push(value);
            },
          },
        });
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: {
            location: {
              href,
              assign: (url: string): void => {
                navigations.push(url);
              },
              reload: (): void => {
                reloadCount++;
              },
            },
          },
        });
        try {
          applyLocaleChange(locale);
          assert.deepEqual(writes, [
            `sf_locale=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`,
          ]);
          const hasOverride = new URL(href).searchParams.has("lang");
          assert.deepEqual(
            navigations,
            hasOverride ? [expectedUrl.toString()] : [],
          );
          assert.equal(reloadCount, hasOverride ? 0 : 1);
        } finally {
          if (previousDocument)
            Object.defineProperty(globalThis, "document", previousDocument);
          else Reflect.deleteProperty(globalThis, "document");
          if (previousWindow)
            Object.defineProperty(globalThis, "window", previousWindow);
          else Reflect.deleteProperty(globalThis, "window");
        }
      });
    }
  }
});
