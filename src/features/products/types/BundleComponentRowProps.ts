import type { PublicBundleComponentDto } from "@/features/products/types/product-bundle.types";

export interface BundleComponentRowProps {
  component: PublicBundleComponentDto;
  noImageLabel: string;
  quantityLabel: string;
  viewProductLabel: string;
}
