/** How many related products to show on the product detail page */
export const RELATED_PRODUCTS_LIMIT = 8;

/**
 * Fetch a few extra same-category products so we can exclude the current
 * product and still fill the strip.
 */
export const RELATED_PRODUCTS_FETCH_LIMIT = RELATED_PRODUCTS_LIMIT + 1;
