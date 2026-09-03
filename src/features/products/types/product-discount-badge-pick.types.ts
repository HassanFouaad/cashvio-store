import { ProductDiscountDto } from "./product-discount.types";

export interface ProductDiscountBadgePick {
  discount: ProductDiscountDto;
  savingsAmount: number;
  isPartialProduct: boolean;
}
