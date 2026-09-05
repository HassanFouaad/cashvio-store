/**
 * Public bundle shapes returned by the storefront API.
 * No SKU, cost, or component variant IDs reach the shopper.
 */

export interface PublicBundleComponentDto {
  displayName: string;
  quantity: number;
}

export interface PublicVariantBundleDto {
  /** Present on both list and detail payloads when the variant is a bundle */
  isBundle: boolean;
  /** True when every component is non-trackable (unlimited sellable quantity) */
  isUnlimited?: boolean;
  /** Total component units per bundle (list/catalog payloads) */
  componentCount?: number;
  /** Present on product detail only */
  components?: PublicBundleComponentDto[];
  /** Sum of component list prices; used for savings display on detail */
  componentsSumPrice?: number | null;
}
