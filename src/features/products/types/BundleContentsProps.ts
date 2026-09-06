import { PublicProductVariantDto } from "@/features/products/types/product.types";

export interface BundleContentsProps {
  variant: PublicProductVariantDto;
  currency: string;
  locale: string;
}
