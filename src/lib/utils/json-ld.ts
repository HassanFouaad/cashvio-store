/**
 * Serialize an object for embedding inside a <script type="application/ld+json"> tag.
 *
 * Plain JSON.stringify is unsafe here: tenant-authored content (product/store
 * names, descriptions, review comments) containing "</script>" would break out
 * of the script tag and execute as HTML (stored XSS). Escaping "<", ">" and "&"
 * as unicode sequences keeps the JSON valid while making tag breakout impossible.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
