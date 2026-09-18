/**
 * Maximum distinct cart lines (variant + modifier selection).
 * Keep in sync with backend CART_MAX_DISTINCT_LINES.
 */
export const CART_MAX_DISTINCT_LINES = 100;

/** Public order preview/checkout item array bound (same as cart ceiling). */
export const MAX_PUBLIC_ORDER_ITEMS = CART_MAX_DISTINCT_LINES;
