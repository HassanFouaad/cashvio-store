import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parse } from "@formatjs/icu-messageformat-parser";
import { IntlMessageFormat } from "intl-messageformat";

interface MessageTree {
  [key: string]: string | MessageTree;
}

function flattenMessages(
  messages: MessageTree,
  prefix = "",
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string"
        ? [[path, value]]
        : Object.entries(flattenMessages(value, path));
    }),
  );
}

const english = flattenMessages(
  JSON.parse(
    readFileSync(new URL("../messages/en.json", import.meta.url), "utf8"),
  ) as MessageTree,
);
const arabic = flattenMessages(
  JSON.parse(
    readFileSync(new URL("../messages/ar.json", import.meta.url), "utf8"),
  ) as MessageTree,
);

describe("storefront ICU messages", () => {
  it("keeps English and Arabic translation keys in sync", () => {
    assert.deepEqual(Object.keys(english).sort(), Object.keys(arabic).sort());
  });

  for (const [locale, messages] of [
    ["en", english],
    ["ar", arabic],
  ] as const) {
    it(`parses every ${locale} message with the same ICU parser used by next-intl`, () => {
      for (const [key, message] of Object.entries(messages)) {
        assert.doesNotThrow(() => parse(message), `${locale}:${key}`);
      }
    });
  }

  it("formats the language-switcher label without i18next double braces", () => {
    assert.equal(
      new IntlMessageFormat(english["language.switchTo"], "en").format({
        language: "العربية",
      }),
      "Switch to العربية",
    );
    assert.equal(
      new IntlMessageFormat(arabic["language.switchTo"], "ar").format({
        language: "English",
      }),
      "التبديل إلى English",
    );
  });
});
