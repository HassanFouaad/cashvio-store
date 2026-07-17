/** Valid CSS hex color: #RGB, #RRGGBB or #RRGGBBAA */
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Build the CSS that applies a tenant's brand colors to the storefront.
 *
 * Overrides the theme tokens in both light and dark mode — the brand color
 * is part of the store identity and does not change with the color scheme.
 * Values are validated against a strict hex pattern before being embedded
 * in a <style> tag, so tenant data can never inject CSS/HTML.
 *
 * Returns null when no valid brand color is configured (default theme applies).
 */
export function buildBrandStyle(
  primaryColor: string | null | undefined,
  primaryTextColor: string | null | undefined,
): string | null {
  const safePrimary =
    primaryColor && HEX_COLOR_REGEX.test(primaryColor) ? primaryColor : null;

  if (!safePrimary) {
    return null;
  }

  const safeText =
    primaryTextColor && HEX_COLOR_REGEX.test(primaryTextColor)
      ? primaryTextColor
      : null;

  const declarations = [
    `--color-primary: ${safePrimary};`,
    `--color-ring: ${safePrimary};`,
    ...(safeText ? [`--color-primary-foreground: ${safeText};`] : []),
  ].join(" ");

  return `:root { ${declarations} } .dark { ${declarations} }`;
}
