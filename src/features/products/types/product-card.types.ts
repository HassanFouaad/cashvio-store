import type { PublicProductDto } from "@/features/products/types/product.types";
import type { ProductCardTranslations } from "@/features/products/utils";
import type { StoreFrontThemeProductCardVariant } from "@/features/store/types/store.types";

export interface ProductCardViewProps {
  product: PublicProductDto;
  currency: string;
  locale: string;
  translations: ProductCardTranslations;
}

export interface ProductCardProps extends ProductCardViewProps {
  variant?: StoreFrontThemeProductCardVariant;
}

export interface ProductCardMediaProps extends ProductCardViewProps {
  sizes?: string;
  isOverlay?: boolean;
}
