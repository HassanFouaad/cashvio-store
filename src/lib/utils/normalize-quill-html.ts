/**
 * Quill often encodes normal word spaces as `&nbsp;` / U+00A0 (especially
 * after paste, or when text lives inside styled `<span>`s). That turns a
 * whole paragraph into one unbreakable run, so the browser mid-word-breaks
 * Arabic and other scripts. Convert those to regular spaces for display.
 */
export function normalizeQuillHtml(html: string): string {
  if (!html) {
    return "";
  }

  return html.replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " ");
}
