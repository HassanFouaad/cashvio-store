import { ThemeTokenKey } from "./theme-constants";
import { ResolvedStoreTheme } from "./resolve-theme";
import { SafeThemeTokenSet } from "./theme-validation";

/**
 * Build the CSS that applies the resolved theme to the storefront.
 *
 * Emits `--color-*` custom-property overrides for `:root` (light) and
 * `.dark`, plus the `--radius` override when the radius differs from the
 * globals.css default. Values reaching this point are already validated
 * (strict hex / rem map), so the output is injection-safe.
 *
 * Returns null for untouched default stores — no <style> tag is rendered
 * and the storefront is byte-identical to the pre-theme-engine output.
 */
export function buildThemeStyle(resolved: ResolvedStoreTheme): string | null {
  const lightDeclarations = [
    ...tokenDeclarations(resolved.tokens?.light),
    ...(resolved.radiusRem ? [`--radius: ${resolved.radiusRem};`] : []),
  ];
  const darkDeclarations = tokenDeclarations(resolved.tokens?.dark);

  if (lightDeclarations.length === 0 && darkDeclarations.length === 0) {
    return null;
  }

  const parts: string[] = [];
  if (lightDeclarations.length > 0) {
    parts.push(`:root { ${lightDeclarations.join(" ")} }`);
  }
  if (darkDeclarations.length > 0) {
    parts.push(`.dark { ${darkDeclarations.join(" ")} }`);
  }

  return parts.join(" ");
}

function tokenDeclarations(
  tokens: SafeThemeTokenSet | undefined,
): string[] {
  if (!tokens) {
    return [];
  }

  return (Object.entries(tokens) as [ThemeTokenKey, string][]).map(
    ([key, value]) => `--color-${toKebabCase(key)}: ${value};`,
  );
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
